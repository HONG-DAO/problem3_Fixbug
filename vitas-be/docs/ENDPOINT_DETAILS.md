# Chi tiết Endpoints API

## 1. Market Data Endpoints

### 1.1 Data Fetch Endpoints

#### POST /api/market-data/fetch/historical
**Mục đích**: Lấy dữ liệu thị trường lịch sử cho các mã cổ phiếu và khung thời gian được chỉ định.

**Cách hoạt động**:
1. Nhận danh sách mã cổ phiếu và tham số truy vấn
2. Kết nối với FiinQuant API để lấy dữ liệu lịch sử
3. Tính toán các chỉ số kỹ thuật (RSI, PSAR, Engulfing patterns, Volume analysis)
4. Lưu dữ liệu vào database theo khung thời gian tương ứng
5. Trả về kết quả với thống kê chi tiết

**Lưu ý**: 
- Dữ liệu được lưu vào các collection riêng biệt theo timeframe (stock-ss15m, stock-ss1h, stock-ss4h, stock-ss1d)
- Quá trình có thể mất vài phút tùy thuộc vào số lượng mã và chu kỳ dữ liệu
- Hệ thống tự động xử lý lỗi và bỏ qua các mã không có dữ liệu

**Request Body**:
```json
{
  "tickers": ["VCB", "VIC", "FPT"],
  "timeframe": "4h",
  "periods": 100,
  "fromDate": "2024-09-15",
  "toDate": "2025-09-15"
}
```

**Response Success (200)**:
```json
{
  "success": true,
  "message": "Historical data fetch completed: 45/50 successful",
  "data": {
    "totalTickers": 50,
    "successfulTickers": 45,
    "failedTickers": 5,
    "totalDataPoints": 4500,
    "timeframeResults": {
      "4h": {
        "successful": 45,
        "failed": 5,
        "totalDataPoints": 4500,
        "errors": []
      }
    }
  },
  "meta": {
    "total": 50,
    "successful": 45,
    "totalDataPoints": 4500
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": ["tickers must be an array", "periods must be between 1 and 1000"]
  }
}
```

**Response Error (500)**:
```json
{
  "success": false,
  "message": "Failed to fetch data from FiinQuant API"
}
```

#### POST /api/market-data/fetch/latest
**Mục đích**: Lấy dữ liệu thị trường mới nhất (real-time) cho các mã cổ phiếu được chỉ định.

**Cách hoạt động**:
1. Nhận danh sách mã cổ phiếu cần lấy dữ liệu
2. Kết nối với FiinQuant API để lấy giá hiện tại
3. Tính toán các chỉ số kỹ thuật cho dữ liệu mới nhất
4. Lưu dữ liệu vào database (nếu có thay đổi)
5. Trả về dữ liệu mới nhất với các chỉ số kỹ thuật

**Lưu ý**:
- Dữ liệu được lấy real-time từ FiinQuant
- Chỉ lấy 1 data point mới nhất cho mỗi mã
- Phù hợp để cập nhật giá hiện tại và tạo tín hiệu giao dịch
- Thời gian phản hồi nhanh (< 5 giây)

#### POST /api/market-data/fetch/incremental
**Mục đích**: Lấy chỉ dữ liệu mới kể từ lần cập nhật cuối cùng để tối ưu hóa hiệu suất.

**Cách hoạt động**:
1. Kiểm tra dữ liệu cuối cùng trong database cho mỗi mã
2. Chỉ lấy dữ liệu mới từ ngày sau lần cập nhật cuối
3. Tính toán lại các chỉ số kỹ thuật cho toàn bộ dataset
4. Lưu chỉ dữ liệu mới vào database
5. Cập nhật các chỉ số kỹ thuật cho dữ liệu cũ nếu cần

**Lưu ý**:
- Tối ưu hóa băng thông và thời gian xử lý
- Phù hợp cho việc cập nhật định kỳ
- Tự động xử lý việc tính toán lại indicators
- Tránh trùng lặp dữ liệu

#### POST /api/market-data/fetch/trading-days
**Mục đích**: Lấy dữ liệu lịch sử cho 252 ngày giao dịch (loại trừ cuối tuần) từ ngày hiện tại.

**Cách hoạt động**:
1. Kiểm tra thời gian hiện tại (trước/sau 16h)
2. Tính toán 252 ngày giao dịch ngược từ ngày hiện tại
3. Loại trừ thứ 7 và chủ nhật khỏi tính toán
4. Lấy dữ liệu cho tất cả các khung thời gian (15m, 1h, 4h, 1d)
5. Tính toán các chỉ số kỹ thuật và lưu vào database

**Logic tính ngày**:
- Nếu trước 16h: tính từ ngày hôm sau
- Nếu sau 16h: tính từ ngày hiện tại
- Chỉ tính các ngày thứ 2-6 (loại trừ cuối tuần)

**Lưu ý**:
- Đây là dữ liệu cơ bản cho phân tích kỹ thuật
- 252 ngày tương đương 1 năm giao dịch
- Phù hợp cho backtesting và phân tích dài hạn

### 1.2 Data Query Endpoints

#### GET /api/market-data/query
**Mục đích**: Truy vấn dữ liệu thị trường với các bộ lọc và phân trang linh hoạt.

**Cách hoạt động**:
1. Nhận các tham số truy vấn (ticker, timeframe, ngày tháng, phân trang)
2. Áp dụng các bộ lọc tương ứng trong database
3. Sắp xếp và phân trang kết quả
4. Trả về dữ liệu với metadata phân trang

**Tham số hỗ trợ**:
- ticker: Lọc theo mã cổ phiếu cụ thể
- tickers: Lọc theo danh sách mã cổ phiếu
- timeframe: Khung thời gian dữ liệu (15m, 1h, 4h, 1d)
- startDate/endDate: Khoảng thời gian
- limit/offset: Phân trang
- sortBy/sortOrder: Sắp xếp

**Lưu ý**:
- Hỗ trợ truy vấn phức tạp với nhiều điều kiện
- Tối ưu hóa hiệu suất với index database
- Trả về metadata chi tiết cho phân trang

#### GET /api/market-data/query/historical/:ticker
**Mục đích**: Lấy dữ liệu lịch sử OHLCV cho một mã cổ phiếu cụ thể.

**Cách hoạt động**:
1. Nhận mã cổ phiếu và các tham số truy vấn
2. Tìm kiếm dữ liệu lịch sử trong database theo timeframe
3. Áp dụng bộ lọc ngày tháng nếu có
4. Giới hạn số lượng kết quả trả về
5. Sắp xếp theo thời gian (từ cũ đến mới)

**Tham số**:
- ticker: Mã cổ phiếu (bắt buộc)
- timeframe: Khung thời gian (15m, 1h, 4h, 1d)
- limit: Số lượng bản ghi tối đa
- fromDate: Ngày bắt đầu (YYYY-MM-DD)
- toDate: Ngày kết thúc (YYYY-MM-DD)

**Lưu ý**:
- Dữ liệu được sắp xếp theo thời gian tăng dần
- Bao gồm tất cả các chỉ số kỹ thuật đã tính toán
- Phù hợp cho việc phân tích kỹ thuật và vẽ biểu đồ

## 2. Trading Analysis Endpoints

### 2.1 Phân tích kỹ thuật

#### POST /api/trading/analysis/ticker
**Mục đích**: Phân tích kỹ thuật cho một mã cổ phiếu cụ thể.

**Cách hoạt động**:
1. Lấy dữ liệu lịch sử cho mã cổ phiếu
2. Tính toán các chỉ số kỹ thuật (RSI, PSAR, Engulfing, Volume)
3. Áp dụng chiến lược RSI-PSAR-Engulfing
4. Tạo tín hiệu giao dịch dựa trên các điều kiện
5. Lưu tín hiệu vào database và trả về kết quả

**Request Body**:
```json
{
  "ticker": "VCB",
  "periods": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Analysis completed for VCB",
  "data": {
    "ticker": "VCB",
    "analysisDate": "2024-09-15T10:00:00.000Z",
    "signals": [
      {
        "signalType": "buy",
        "confidence": 0.85,
        "entryPrice": 85000,
        "stopLoss": 78000,
        "takeProfit": 95000,
        "reason": "RSI oversold + PSAR uptrend + bullish engulfing pattern",
        "indicators": {
          "rsi": 28.5,
          "psar": 82000,
          "psarTrend": "up",
          "engulfingPattern": 1,
          "volumeAnomaly": true
        }
      }
    ],
    "technicalIndicators": {
      "rsi": 28.5,
      "psar": 82000,
      "psarTrend": "up",
      "engulfingPattern": 1,
      "volumeAnomaly": true,
      "priceVsPsar": true
    },
    "marketData": {
      "currentPrice": 85000,
      "change": 1500,
      "changePercent": 1.76,
      "volume": 1500000
    }
  }
}
```

#### POST /api/trading/analysis/bulk
**Mục đích**: Phân tích kỹ thuật cho nhiều mã cổ phiếu cùng lúc.

**Cách hoạt động**:
1. Nhận danh sách mã cổ phiếu
2. Thực hiện phân tích song song cho từng mã
3. Tổng hợp kết quả và thống kê
4. Trả về danh sách tín hiệu và metrics

**Request Body**:
```json
{
  "tickers": ["VCB", "VIC", "FPT"],
  "periods": 100
}
```

**Response**:
```json
{
  "success": true,
  "message": "Bulk analysis completed",
  "data": {
    "totalTickers": 3,
    "successfulAnalysis": 3,
    "failedAnalysis": 0,
    "totalSignals": 5,
    "signalsByType": {
      "buy": 3,
      "sell": 1,
      "risk_warning": 1
    },
    "results": [
      {
        "ticker": "VCB",
        "signals": [...],
        "technicalIndicators": {...}
      }
    ],
    "summary": {
      "avgConfidence": 0.78,
      "highConfidenceSignals": 2,
      "riskWarnings": 1
    }
  }
}
```

## 3. Risk Management Endpoints

### 3.1 Quản lý rủi ro

#### POST /api/trading/risk/position-size
**Mục đích**: Tính toán kích thước vị thế tối ưu dựa trên rủi ro và giá trị danh mục.

**Cách hoạt động**:
1. Nhận thông tin giao dịch (ticker, entry price, stop loss, portfolio value)
2. Tính toán rủi ro tuyệt đối và phần trăm
3. Áp dụng quy tắc quản lý rủi ro (2% rule)
4. Tính toán kích thước vị thế tối ưu
5. Trả về khuyến nghị chi tiết

**Request Body**:
```json
{
  "ticker": "VCB",
  "entryPrice": 85000,
  "stopLossPrice": 78000,
  "portfolioValue": 1000000000
}
```

**Response**:
```json
{
  "success": true,
  "message": "Position size calculated successfully",
  "data": {
    "ticker": "VCB",
    "entryPrice": 85000,
    "stopLossPrice": 78000,
    "portfolioValue": 1000000000,
    "riskAmount": 7000,
    "riskPercent": 0.82,
    "recommendedPositionSize": 285714,
    "positionValue": 24285714000,
    "positionPercent": 2.43,
    "riskLevel": "medium",
    "recommendations": [
      "Position size is within acceptable risk limits",
      "Consider reducing position if portfolio concentration is high"
    ]
  }
}
```

#### GET /api/trading/risk/metrics
**Mục đích**: Lấy các metrics rủi ro hiện tại của danh mục.

**Query Parameters**:
- `portfolioValue`: Tổng giá trị danh mục đầu tư (bắt buộc)

**Response**:
```json
{
  "success": true,
  "message": "Risk metrics retrieved successfully",
  "data": {
    "totalPortfolioValue": 1000000000,
    "totalExposure": 500000000,
    "dailyPnl": 15000000,
    "dailyDrawdown": 0.02,
    "activePositionsCount": 5,
    "riskLimitUsage": 0.5,
    "maxPositionSize": 20000000,
    "diversificationScore": 0.75,
    "riskLevel": "medium",
    "warnings": [
      "Portfolio concentration in technology sector is high",
      "Consider diversifying across different sectors"
    ]
  }
}
```

#### GET /api/trading/risk/warnings
**Mục đích**: Lấy danh sách các cảnh báo rủi ro hiện tại.

**Response**:
```json
{
  "success": true,
  "message": "Risk warnings retrieved successfully",
  "data": {
    "warnings": [
      {
        "type": "concentration",
        "level": "medium",
        "message": "Portfolio concentration in technology sector is high",
        "recommendation": "Consider diversifying across different sectors"
      },
      {
        "type": "volatility",
        "level": "high",
        "message": "High volatility detected in VCB position",
        "recommendation": "Consider reducing position size or tightening stop loss"
      }
    ],
    "totalWarnings": 2,
    "criticalWarnings": 0,
    "highWarnings": 1,
    "mediumWarnings": 1
  }
}
```

## 4. Trading Strategy Endpoints

### 4.1 Quản lý chiến lược

#### GET /api/trading/strategy/ticker/:ticker
**Mục đích**: Lấy trạng thái giao dịch hiện tại của một mã cổ phiếu.

**Path Parameters**:
- `ticker`: Mã cổ phiếu (bắt buộc)

**Response**:
```json
{
  "success": true,
  "message": "Ticker state retrieved successfully",
  "data": {
    "ticker": "VCB",
    "lastUpdate": "2024-09-15T10:00:00.000Z",
    "currentPrice": 85000,
    "positionStatus": "long",
    "entryPrice": 82000,
    "entryDate": "2024-09-10T09:30:00.000Z",
    "unrealizedPnl": 3000000,
    "unrealizedPnlPercent": 3.66,
    "maxPriceSinceEntry": 86000,
    "trailingStopPrice": 84000,
    "lastSignalType": "buy",
    "lastSignalTime": "2024-09-10T09:30:00.000Z"
  }
}
```

#### GET /api/trading/strategy/performance
**Mục đích**: Lấy các metrics hiệu suất của chiến lược giao dịch.

**Response**:
```json
{
  "success": true,
  "message": "Performance metrics retrieved successfully",
  "data": {
    "totalSignals": 150,
    "buySignals": 85,
    "sellSignals": 45,
    "riskWarnings": 20,
    "winRate": 0.68,
    "avgConfidence": 0.75,
    "totalPnl": 15000000,
    "maxDrawdown": 0.12,
    "sharpeRatio": 1.45,
    "avgTradeDuration": 5.2,
    "topPerformers": [
      {
        "ticker": "VCB",
        "signals": 12,
        "winRate": 0.83,
        "totalPnl": 5000000
      }
    ],
    "performanceByMonth": [
      {
        "month": "2024-09",
        "signals": 25,
        "winRate": 0.72,
        "pnl": 3000000
      }
    ]
  }
}
```

#### GET /api/trading/strategy/status
**Mục đích**: Lấy trạng thái tổng quan của hệ thống giao dịch.

**Response**:
```json
{
  "success": true,
  "message": "Strategy status retrieved successfully",
  "data": {
    "isActive": true,
    "uptime": "5 days, 12 hours",
    "lastAnalysis": "2024-09-15T10:00:00.000Z",
    "activeTickers": 15,
    "openPositions": 5,
    "totalSignalsToday": 8,
    "systemHealth": "healthy",
    "riskStatus": "normal",
    "performance": {
      "todayPnl": 500000,
      "weekPnl": 2500000,
      "monthPnl": 8000000
    },
    "alerts": {
      "telegram": "connected",
      "email": "connected",
      "lastSent": "2024-09-15T09:30:00.000Z"
    }
  }
}
```

## 5. Alerts & Notifications Endpoints

### 5.1 Quản lý thông báo

#### GET /api/alerts/status
**Mục đích**: Lấy trạng thái của hệ thống thông báo.

**Response**:
```json
{
  "success": true,
  "message": "Alert status retrieved successfully",
  "data": {
    "telegram": {
      "enabled": true,
      "connected": true,
      "lastMessage": "2024-09-15T09:30:00.000Z",
      "messagesToday": 5,
      "rateLimitRemaining": 15
    },
    "email": {
      "enabled": true,
      "connected": true,
      "lastSent": "2024-09-15T08:00:00.000Z",
      "emailsToday": 2,
      "rateLimitRemaining": 8
    },
    "dailySummary": {
      "sentToday": true,
      "lastSent": "2024-09-15T17:00:00.000Z"
    }
  }
}
```

#### POST /api/alerts/test/telegram
**Mục đích**: Test kết nối Telegram bot.

**Response**:
```json
{
  "success": true,
  "message": "Telegram test message sent successfully"
}
```

#### POST /api/alerts/test/email
**Mục đích**: Test gửi email.

**Response**:
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

#### POST /api/alerts/test/system-alert
**Mục đích**: Gửi test system alert.

**Request Body**:
```json
{
  "message": "Test system alert",
  "alertType": "info",
  "sendTelegram": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "System alert sent successfully",
  "data": {
    "telegram": {
      "sent": true,
      "messageId": "12345"
    },
    "email": {
      "sent": false,
      "reason": "Not requested"
    }
  }
}
```

#### POST /api/alerts/test/trading-signal
**Mục đích**: Gửi test trading signal.

**Request Body**:
```json
{
  "ticker": "VCB",
  "signalType": "buy",
  "confidence": 0.85,
  "price": 85000,
  "sendTelegram": true,
  "sendEmail": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Trading signal sent successfully",
  "data": {
    "telegram": {
      "sent": true,
      "messageId": "12346"
    },
    "email": {
      "sent": true,
      "messageId": "email-12346"
    }
  }
}
```

#### POST /api/alerts/test/daily-summary
**Mục đích**: Gửi test daily summary.

**Request Body**:
```json
{
  "sendTelegram": true,
  "sendEmail": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Daily summary sent successfully",
  "data": {
    "telegram": {
      "sent": true,
      "messageId": "12347"
    },
    "email": {
      "sent": true,
      "messageId": "email-12347"
    },
    "summary": {
      "totalSignals": 8,
      "buySignals": 5,
      "sellSignals": 2,
      "riskWarnings": 1,
      "topPerformers": ["VCB", "VIC", "FPT"]
    }
  }
}
```

#### POST /api/alerts/test/portfolio-update
**Mục đích**: Gửi test portfolio update.

**Request Body**:
```json
{
  "sendTelegram": true,
  "sendEmail": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Portfolio update sent successfully",
  "data": {
    "telegram": {
      "sent": true,
      "messageId": "12348"
    },
    "email": {
      "sent": true,
      "messageId": "email-12348"
    },
    "portfolio": {
      "totalValue": 1000000000,
      "totalPnl": 15000000,
      "totalPnlPercent": 1.5,
      "activePositions": 5,
      "topPositions": [
        {
          "ticker": "VCB",
          "value": 200000000,
          "pnl": 5000000,
          "pnlPercent": 2.5
        }
      ]
    }
  }
}
```

#### POST /api/alerts/reset-email-flags
**Mục đích**: Reset các flag email để test lại.

**Response**:
```json
{
  "success": true,
  "message": "Email flags reset successfully"
}
```

## 6. Scheduler Endpoints

### 6.1 Quản lý scheduler

#### GET /api/scheduler/status
**Mục đích**: Lấy trạng thái của hệ thống scheduler.

**Response**:
```json
{
  "success": true,
  "message": "Scheduler status retrieved successfully",
  "data": {
    "isRunning": false,
    "lastFetchTime": "2024-09-15T09:00:00.000Z",
    "nextFetchTime": "2024-09-15T10:00:00.000Z",
    "totalTickers": 1446,
    "fetchCount": 5,
    "successRate": 0.95,
    "isTradingTime": true,
    "isTopOfHour": false,
    "timeUntilNextFetch": "45 minutes"
  }
}
```

#### POST /api/scheduler/trigger-fetch
**Mục đích**: Kích hoạt fetch dữ liệu thủ công.

**Response**:
```json
{
  "success": true,
  "message": "Manual fetch triggered successfully",
  "data": {
    "fetchId": "fetch-12345",
    "startTime": "2024-09-15T10:15:00.000Z",
    "estimatedDuration": "5-10 minutes",
    "tickersCount": 1446
  }
}
```

#### POST /api/scheduler/refresh-tickers
**Mục đích**: Làm mới danh sách tickers từ file CSV.

**Response**:
```json
{
  "success": true,
  "message": "Tickers refreshed successfully",
  "data": {
    "totalTickers": 1446,
    "newTickers": 12,
    "removedTickers": 3,
    "lastUpdated": "2024-09-15T10:15:00.000Z"
  }
}
```

#### GET /api/scheduler/next-fetch
**Mục đích**: Lấy thời gian fetch dữ liệu tiếp theo.

**Response**:
```json
{
  "success": true,
  "message": "Next fetch time retrieved successfully",
  "data": {
    "nextFetchTime": "2024-09-15T10:00:00.000Z",
    "timeUntilNextFetch": "45 minutes",
    "isTradingTime": true,
    "isTopOfHour": false
  }
}
```

## 7. Dashboard Endpoints

### 7.1 Dữ liệu dashboard

#### GET /api/dashboard/data
**Mục đích**: Lấy dữ liệu tổng quan cho dashboard.

**Response**:
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "marketOverview": {
      "totalTickers": 1446,
      "activeTickers": 1200,
      "marketStatus": "open",
      "lastUpdate": "2024-09-15T10:00:00.000Z"
    },
    "performance": {
      "todayPnl": 500000,
      "weekPnl": 2500000,
      "monthPnl": 8000000,
      "totalSignals": 150,
      "winRate": 0.68
    },
    "topSignals": [
      {
        "ticker": "VCB",
        "signalType": "buy",
        "confidence": 0.92,
        "price": 85000,
        "timestamp": "2024-09-15T09:30:00.000Z"
      }
    ],
    "riskMetrics": {
      "totalExposure": 500000000,
      "riskLevel": "medium",
      "warnings": 2
    }
  }
}
```

#### GET /api/dashboard/signals
**Mục đích**: Lấy tín hiệu giao dịch real-time.

**Query Parameters**:
- `limit`: Số lượng tín hiệu tối đa (default: 50)
- `signalType`: Lọc theo loại tín hiệu (buy/sell/risk_warning)
- `timeframe`: Khung thời gian (15m, 1h, 4h, 1d)

**Response**:
```json
{
  "success": true,
  "message": "Signals retrieved successfully",
  "data": {
    "signals": [
      {
        "ticker": "VCB",
        "signalType": "buy",
        "confidence": 0.92,
        "entryPrice": 85000,
        "stopLoss": 78000,
        "takeProfit": 95000,
        "reason": "RSI oversold + PSAR uptrend + bullish engulfing pattern",
        "timestamp": "2024-09-15T09:30:00.000Z",
        "timeframe": "4h",
        "indicators": {
          "rsi": 28.5,
          "psar": 82000,
          "psarTrend": "up",
          "engulfingPattern": 1,
          "volumeAnomaly": true
        }
      }
    ],
    "totalSignals": 25,
    "signalsByType": {
      "buy": 15,
      "sell": 8,
      "risk_warning": 2
    },
    "lastUpdate": "2024-09-15T10:00:00.000Z"
  }
}
```

#### GET /api/dashboard/market-analysis
**Mục đích**: Lấy phân tích tình hình thị trường hiện tại.

**Response**:
```json
{
  "success": true,
  "message": "Market analysis retrieved successfully",
  "data": {
    "scenario": {
      "name": "THỊ TRƯỜNG TĂNG MẠNH",
      "description": "Thị trường đang trong xu hướng tăng mạnh với nhiều cơ hội đầu tư",
      "recommendation": "Tích cực tìm kiếm cơ hội mua vào",
      "riskLevel": "medium"
    },
    "conditions": {
      "buySignalRatio": 0.65,
      "rsiBelow50Ratio": 0.72,
      "psarUptrendRatio": 0.68,
      "volumeIncrease": 0.25,
      "bullishEngulfingRatio": 0.42
    },
    "statistics": {
      "totalTickers": 1200,
      "analyzedTickers": 1150,
      "signalsGenerated": 45,
      "highConfidenceSignals": 12
    },
    "topPerformers": [
      {
        "ticker": "VCB",
        "signalType": "buy",
        "confidence": 0.92,
        "price": 85000,
        "change": 1500,
        "changePercent": 1.76
      }
    ],
    "analysisDate": "2024-09-15T10:00:00.000Z"
  }
}
```

