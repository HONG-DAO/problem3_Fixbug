# Backtest Module

Module backtest cho hệ thống trading VITAS, cho phép giả lập dữ liệu realtime để test các chiến lược trading.

## 🚀 Tính năng

- **Replay dữ liệu lịch sử**: Đọc dữ liệu từ MongoDB và replay theo thứ tự thời gian
- **Phân tích realtime**: Sử dụng `AnalysisService` để phân tích từng candle
- **Sinh tín hiệu trading**: Tạo tín hiệu buy/sell/risk_warning như thực tế
- **Gửi notification**: Gửi Telegram/Email notification (có thể tắt bằng dry-run)
- **Tốc độ tùy chỉnh**: Có thể điều chỉnh tốc độ replay (ms per candle)
- **API endpoints**: RESTful API để điều khiển backtest

## 📁 Cấu trúc

```
src/modules/backtest/
├── backtest.module.ts          # Module definition
├── backtest.service.ts         # Core backtest logic
├── backtest.controller.ts      # REST API endpoints
└── dto/
    └── backtest.dto.ts         # Data Transfer Objects
```

## 🔧 Cấu hình Environment

Thêm vào file `.env`:

```env
# Backtest Configuration
BACKTEST_ENABLED=true
BACKTEST_TICKERS=VCB,FPT,VIC,VHM,HPG
BACKTEST_TIMEFRAME=15m
BACKTEST_SPEED=50
DRY_RUN=false
```

### Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `BACKTEST_ENABLED` | Bật/tắt backtest | `false` |
| `BACKTEST_TICKERS` | Danh sách tickers (comma-separated) | `VCB,FPT` |
| `BACKTEST_TIMEFRAME` | Timeframe dữ liệu | `15m` |
| `BACKTEST_SPEED` | Tốc độ replay (ms per candle) | `50` |
| `DRY_RUN` | Chế độ dry-run (không gửi notification) | `false` |

## 🛠️ API Endpoints

### POST `/api/backtest/run`

Chạy backtest với tham số tùy chỉnh.

**Request Body:**
```json
{
  "tickers": ["VCB", "FPT"],
  "timeframe": "15m",
  "limit": 1000,
  "speed": 50,
  "dryRun": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Backtest completed successfully",
  "data": {
    "totalTickers": 2,
    "totalCandles": 2000,
    "totalSignals": 35,
    "totalProcessingTimeMs": 120000,
    "overallStatus": "completed",
    "results": [
      {
        "ticker": "VCB",
        "totalCandles": 1000,
        "buySignals": 15,
        "sellSignals": 12,
        "riskWarnings": 8,
        "processingTimeMs": 60000,
        "firstSignalTime": "2024-01-15T09:30:00.000Z",
        "lastSignalTime": "2024-01-19T15:00:00.000Z",
        "status": "completed"
      }
    ]
  }
}
```

### GET `/api/backtest/status`

Lấy trạng thái backtest hiện tại.

### GET `/api/backtest/config`

Lấy cấu hình backtest từ environment.

### DELETE `/api/backtest/cancel`

Hủy backtest đang chạy.

### POST `/api/backtest/run-auto`

Chạy backtest với cấu hình từ environment.

## 🔄 Cách hoạt động

1. **Khởi tạo**: Service đọc cấu hình từ environment
2. **Lấy dữ liệu**: Sử dụng `MarketDataService` để lấy dữ liệu lịch sử
3. **Sắp xếp**: Sắp xếp dữ liệu theo timestamp ASC
4. **Replay**: Lặp qua từng candle:
   - Gọi `AnalysisService` để phân tích
   - Sinh tín hiệu trading
   - Lưu vào database (nếu không phải dry-run)
   - Gửi notification (nếu không phải dry-run)
   - Delay theo tốc độ đã cấu hình
5. **Thống kê**: Trả về báo cáo chi tiết

## 🧪 Testing

### Test Service
```bash
node scripts/test-backtest.js
```

### Test API
```bash
# Chạy backtest
curl -X POST http://localhost:3333/api/backtest/run \
  -H "Content-Type: application/json" \
  -d '{
    "tickers": ["VCB"],
    "timeframe": "15m",
    "limit": 100,
    "speed": 10,
    "dryRun": true
  }'

# Kiểm tra trạng thái
curl http://localhost:3333/api/backtest/status

# Chạy auto backtest
curl -X POST http://localhost:3333/api/backtest/run-auto
```

## 📊 Dependencies

- `MarketDataService`: Lấy dữ liệu lịch sử
- `AnalysisService`: Phân tích kỹ thuật và sinh tín hiệu
- `TradingSignalService`: Lưu tín hiệu vào database
- `TelegramService`: Gửi notification Telegram
- `EmailService`: Gửi notification Email

## ⚠️ Lưu ý

- **Concurrency**: Chỉ cho phép 1 backtest chạy tại 1 thời điểm
- **Performance**: Với dữ liệu lớn, backtest có thể mất nhiều thời gian
- **Dry Run**: Luôn test với `dryRun: true` trước khi chạy thực tế
- **Memory**: Với dữ liệu lớn, cần đảm bảo đủ RAM
- **Database**: Đảm bảo MongoDB có đủ dữ liệu lịch sử

## 🔧 Customization

### Thay đổi logic sinh tín hiệu

Sửa method `shouldGenerateSignal()` và `createMockSignal()` trong `BacktestService`:

```typescript
private shouldGenerateSignal(candle: any): boolean {
  // Custom logic here
  return Math.abs(candle.changePercent || 0) > 2;
}

private createMockSignal(candle: any): ITradingSignal {
  // Custom signal creation here
  return {
    // ... signal properties
  };
}
```

### Thay đổi tốc độ replay

```typescript
// Trong processTicker method
if (dto.speed && dto.speed > 0) {
  await this.delay(dto.speed);
}
```

## 📈 Monitoring

Service có logging chi tiết:
- `🚀 Starting backtest`
- `📊 Processing ticker`
- `🔄 Processing candle`
- `💾 Saved signal`
- `✅ Completed ticker`
- `✅ Backtest completed`

Sử dụng `this.logger.log()` để theo dõi tiến trình.
