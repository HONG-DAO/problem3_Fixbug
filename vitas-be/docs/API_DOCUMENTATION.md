# VITAS Trading System API Documentation

## Tổng quan

VITAS Trading System là một hệ thống giao dịch tự động với phân tích kỹ thuật AI, cung cấp tín hiệu giao dịch real-time và quản lý rủi ro thông minh.

### Base URL
```
http://localhost:3333/api
```

### Authentication
Hiện tại hệ thống không yêu cầu authentication (single-user mode).

## 1. Market Data - Fetch

### 1.1 Lấy dữ liệu lịch sử
**POST** `/api/market-data/fetch/historical`

**Mục đích**: Lấy dữ liệu thị trường lịch sử cho các mã cổ phiếu và khung thời gian được chỉ định.

**Cách hoạt động**:
1. Nhận danh sách mã cổ phiếu và tham số truy vấn
2. Kết nối với FiinQuant API để lấy dữ liệu lịch sử
3. Tính toán các chỉ số kỹ thuật (RSI, PSAR, Engulfing patterns, Volume analysis)
4. Lưu dữ liệu vào database theo khung thời gian tương ứng
5. Trả về kết quả với thống kê chi tiết

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

**Response**:
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
  }
}
```

### 1.2 Lấy dữ liệu mới nhất
**POST** `/api/market-data/fetch/latest`

**Mục đích**: Lấy dữ liệu thị trường mới nhất (real-time) cho các mã cổ phiếu được chỉ định.

**Request Body**:
```json
{
  "tickers": ["VCB", "VIC", "FPT"],
  "timeframe": "4h"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Latest data fetched successfully",
  "data": {
    "totalTickers": 3,
    "successfulTickers": 3,
    "failedTickers": 0,
    "totalDataPoints": 3,
    "results": {
      "VCB": {
        "ticker": "VCB",
        "timestamp": "2024-09-15T09:30:00.000Z",
        "open": 85000,
        "high": 87000,
        "low": 84000,
        "close": 86500,
        "volume": 1500000,
        "rsi": 45.2,
        "psar": 82000,
        "psarTrend": "up"
      }
    }
  }
}
```

### 1.3 Lấy dữ liệu tăng trưởng
**POST** `/api/market-data/fetch/incremental`

**Mục đích**: Lấy chỉ dữ liệu mới kể từ lần cập nhật cuối cùng để tối ưu hóa hiệu suất.

**Request Body**:
```json
{
  "tickers": ["VCB", "VIC", "FPT"],
  "timeframe": "4h"
}
```

### 1.4 Lấy dữ liệu 252 ngày giao dịch
**POST** `/api/market-data/fetch/trading-days`

**Mục đích**: Lấy dữ liệu lịch sử cho 252 ngày giao dịch (loại trừ cuối tuần) từ ngày hiện tại.

**Request Body**:
```json
{
  "tickers": ["VCB", "VIC", "FPT"],
  "timeframe": "4h"
}
```

## 2. Market Data - Query

### 2.1 Truy vấn dữ liệu thị trường
**GET** `/api/market-data/query`

**Mục đích**: Truy vấn dữ liệu thị trường với các bộ lọc và phân trang linh hoạt.

**Query Parameters**:
- `ticker`: Lọc theo mã cổ phiếu cụ thể
- `tickers`: Lọc theo danh sách mã cổ phiếu
- `timeframe`: Khung thời gian dữ liệu (15m, 1h, 4h, 1d)
- `startDate`: Ngày bắt đầu (YYYY-MM-DD)
- `endDate`: Ngày kết thúc (YYYY-MM-DD)
- `limit`: Số lượng bản ghi trả về (default: 100)
- `offset`: Số lượng bản ghi bỏ qua (default: 0)
- `sortBy`: Trường để sắp xếp
- `sortOrder`: Thứ tự sắp xếp (asc/desc)

**Example**:
```
GET /api/market-data/query?ticker=VCB&timeframe=4h&limit=50&startDate=2024-09-01
```

### 2.2 Lấy dữ liệu lịch sử cho mã cổ phiếu
**GET** `/api/market-data/query/historical/:ticker`

**Mục đích**: Lấy dữ liệu lịch sử OHLCV cho một mã cổ phiếu cụ thể.

**Path Parameters**:
- `ticker`: Mã cổ phiếu (bắt buộc)

**Query Parameters**:
- `timeframe`: Khung thời gian dữ liệu (default: 4h)
- `limit`: Số lượng bản ghi tối đa (default: 100)
- `fromDate`: Ngày bắt đầu (YYYY-MM-DD)
- `toDate`: Ngày kết thúc (YYYY-MM-DD)

**Example**:
```
GET /api/market-data/query/historical/VCB?timeframe=4h&limit=100&fromDate=2024-09-01
```

### 2.3 Lấy dữ liệu mới nhất cho mã cổ phiếu
**GET** `/api/market-data/query/latest/:ticker`

**Mục đích**: Lấy dữ liệu mới nhất cho một mã cổ phiếu cụ thể.

**Path Parameters**:
- `ticker`: Mã cổ phiếu (bắt buộc)

**Query Parameters**:
- `timeframe`: Khung thời gian dữ liệu (default: 4h)

### 2.4 Lấy dữ liệu OHLCV cho biểu đồ
**GET** `/api/market-data/query/ohlcv/:ticker`

**Mục đích**: Lấy dữ liệu OHLCV candlestick cho vẽ biểu đồ.

**Path Parameters**:
- `ticker`: Mã cổ phiếu (bắt buộc)

**Query Parameters**:
- `timeframe`: Khung thời gian dữ liệu (default: 4h)
- `limit`: Số lượng bản ghi tối đa (default: 100)

### 2.5 Lấy thống kê thị trường
**GET** `/api/market-data/query/statistics`

**Mục đích**: Lấy thống kê tổng quan về thị trường cho khung thời gian cụ thể.

**Query Parameters**:
- `hours`: Số giờ gần đây (default: 24)
- `timeframe`: Khung thời gian dữ liệu (default: 4h)

### 2.6 Lấy danh sách tất cả mã cổ phiếu
**GET** `/api/market-data/query/all-tickers`

**Mục đích**: Lấy danh sách tất cả mã cổ phiếu có sẵn từ FiinQuant.

### 2.7 Lấy thông tin collection
**GET** `/api/market-data/query/collections`

**Mục đích**: Lấy thông tin về tất cả collection timeframe và số lượng document.

## 3. Trading Analysis

### 3.1 Phân tích kỹ thuật cho một mã
**POST** `/api/trading/analysis/ticker`

**Mục đích**: Phân tích kỹ thuật cho một mã cổ phiếu cụ thể.

**Request Body**:
```json
{
  "ticker": "VCB",
  "periods": 100
}
```

### 3.2 Phân tích kỹ thuật hàng loạt
**POST** `/api/trading/analysis/bulk`

**Mục đích**: Phân tích kỹ thuật cho nhiều mã cổ phiếu cùng lúc.

**Request Body**:
```json
{
  "tickers": ["VCB", "VIC", "FPT"],
  "periods": 100
}
```

## 4. Risk Management

### 4.1 Tính kích thước vị thế tối ưu
**POST** `/api/trading/risk/position-size`

**Mục đích**: Tính toán kích thước vị thế tối ưu dựa trên rủi ro và giá trị danh mục.

**Request Body**:
```json
{
  "ticker": "VCB",
  "entryPrice": 85000,
  "stopLossPrice": 78000,
  "portfolioValue": 1000000000
}
```

### 4.2 Lấy metrics rủi ro hiện tại
**GET** `/api/trading/risk/metrics`

**Query Parameters**:
- `portfolioValue`: Tổng giá trị danh mục đầu tư

### 4.3 Lấy cảnh báo rủi ro
**GET** `/api/trading/risk/warnings`

**Mục đích**: Lấy danh sách các cảnh báo rủi ro hiện tại.

## 5. Trading Strategy

### 5.1 Lấy trạng thái ticker
**GET** `/api/trading/strategy/ticker/:ticker`

**Mục đích**: Lấy trạng thái giao dịch hiện tại của một mã cổ phiếu.

### 5.2 Lấy hiệu suất chiến lược
**GET** `/api/trading/strategy/performance`

**Mục đích**: Lấy các metrics hiệu suất của chiến lược giao dịch.

### 5.3 Lấy trạng thái chiến lược
**GET** `/api/trading/strategy/status`

**Mục đích**: Lấy trạng thái tổng quan của hệ thống giao dịch.

## 6. Alerts & Notifications

### 6.1 Lấy trạng thái alerts
**GET** `/api/alerts/status`

**Mục đích**: Lấy trạng thái của hệ thống thông báo.

### 6.2 Test Telegram
**POST** `/api/alerts/test/telegram`

**Mục đích**: Test kết nối Telegram bot.

### 6.3 Test Email
**POST** `/api/alerts/test/email`

**Mục đích**: Test gửi email.

### 6.4 Gửi test system alert
**POST** `/api/alerts/test/system-alert`

**Request Body**:
```json
{
  "message": "Test system alert",
  "alertType": "info",
  "sendTelegram": true
}
```

### 6.5 Gửi test trading signal
**POST** `/api/alerts/test/trading-signal`

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

### 6.6 Gửi test daily summary
**POST** `/api/alerts/test/daily-summary`

**Request Body**:
```json
{
  "sendTelegram": true,
  "sendEmail": true
}
```

### 6.7 Gửi test portfolio update
**POST** `/api/alerts/test/portfolio-update`

**Request Body**:
```json
{
  "sendTelegram": true,
  "sendEmail": true
}
```

### 6.8 Reset email flags
**POST** `/api/alerts/reset-email-flags`

**Mục đích**: Reset các flag email để test lại.

## 7. Scheduler

### 7.1 Lấy trạng thái scheduler
**GET** `/api/scheduler/status`

**Mục đích**: Lấy trạng thái của hệ thống scheduler.

### 7.2 Kích hoạt fetch thủ công
**POST** `/api/scheduler/trigger-fetch`

**Mục đích**: Kích hoạt fetch dữ liệu thủ công.

### 7.3 Refresh danh sách tickers
**POST** `/api/scheduler/refresh-tickers`

**Mục đích**: Làm mới danh sách tickers từ file CSV.

### 7.4 Lấy thời gian fetch tiếp theo
**GET** `/api/scheduler/next-fetch`

**Mục đích**: Lấy thời gian fetch dữ liệu tiếp theo.

## 8. Dashboard

### 8.1 Lấy dữ liệu dashboard
**GET** `/api/dashboard/data`

**Mục đích**: Lấy dữ liệu tổng quan cho dashboard.

### 8.2 Lấy tín hiệu real-time
**GET** `/api/dashboard/signals`

**Mục đích**: Lấy tín hiệu giao dịch real-time.

### 8.3 Lấy phân tích thị trường
**GET** `/api/dashboard/market-analysis`

**Mục đích**: Lấy phân tích tình hình thị trường hiện tại.

## Error Codes

### 400 Bad Request
- Dữ liệu đầu vào không hợp lệ
- Thiếu tham số bắt buộc
- Format dữ liệu sai

### 404 Not Found
- Không tìm thấy dữ liệu
- Endpoint không tồn tại

### 500 Internal Server Error
- Lỗi server
- Lỗi kết nối database
- Lỗi kết nối FiinQuant API

## Rate Limiting

### Telegram
- Tối đa 20 alerts/giờ
- Debounce 5 phút giữa các alerts cùng loại

### Email
- Tối đa 10 emails/giờ
- Debounce 15 phút giữa các emails cùng loại
- Daily summary chỉ gửi 1 lần/ngày

## Data Models

### Market Data Point
```json
{
  "ticker": "VCB",
  "timestamp": "2024-09-15T09:00:00.000Z",
  "timeframe": "4h",
  "open": 85000,
  "high": 87000,
  "low": 84000,
  "close": 86500,
  "volume": 1500000,
  "change": 1500,
  "changePercent": 1.76,
  "totalMatchValue": 129750000000,
  "foreignBuyVolume": 500000,
  "foreignSellVolume": 300000,
  "matchVolume": 1200000,
  "rsi": 45.2,
  "psar": 82000,
  "psarTrend": "up",
  "engulfingPattern": 1,
  "volumeAnomaly": true,
  "priceVsPsar": true,
  "avgVolume20": 1200000
}
```

### Trading Signal
```json
{
  "ticker": "VCB",
  "timestamp": "2024-09-15T09:30:00.000Z",
  "signalType": "buy",
  "confidence": 0.85,
  "entryPrice": 85000,
  "stopLoss": 78000,
  "takeProfit": 95000,
  "reason": "RSI oversold + PSAR uptrend + bullish engulfing pattern",
  "timeframe": "4h",
  "indicators": {
    "rsi": 28.5,
    "psar": 82000,
    "psarTrend": "up",
    "engulfingPattern": 1,
    "volumeAnomaly": true,
    "priceVsPsar": true
  },
  "metadata": {
    "rsiOversold": true,
    "psarUptrend": true,
    "priceAbovePsar": true,
    "bullishEngulfing": true,
    "volumeAnomaly": true
  }
}
```

## Changelog

### v1.0.0 (2024-09-15)
- Initial release
- Market data fetching and querying
- Technical analysis with RSI-PSAR-Engulfing strategy
- Risk management and position sizing
- Telegram and Email notifications
- Automated scheduler
- Dashboard API endpoints

