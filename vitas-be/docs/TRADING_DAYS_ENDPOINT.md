# Trading Days Data Fetch Endpoint

## 📋 Tổng quan

Endpoint mới `/api/market-data/fetch/trading-days` được thiết kế để fetch dữ liệu cho 252 ngày giao dịch (không tính thứ 7, chủ nhật) với logic thông minh về thời gian.

## 🕐 Logic thời gian

### Kiểm tra giờ hiện tại:
- **Trước 16:00 (4 PM)**: Bắt đầu từ ngày mai
- **Sau 16:00 (4 PM)**: Bao gồm ngày hiện tại trong 252 ngày

### Tính toán 252 ngày giao dịch:
- Chỉ tính các ngày từ **Thứ 2 đến Thứ 6**
- Bỏ qua **Thứ 7 và Chủ nhật**
- Đảm bảo chính xác 252 ngày giao dịch

## 🚀 Cách sử dụng

### 1. API Endpoint
```http
POST /api/market-data/fetch/trading-days
Content-Type: application/json

{
  "tickers": ["VCB", "VIC", "FPT", "HPG"],
  "timeframe": "4h"
}
```

### 2. Response Format
```json
{
  "success": true,
  "message": "Trading days data fetch completed: 12/4 successful",
  "data": {
    "totalTickers": 4,
    "successfulTickers": 12,
    "failedTickers": 4,
    "totalDataPoints": 15000,
    "tradingDays": 252,
    "dateRange": {
      "startDate": "2023-09-18",
      "endDate": "2024-09-17"
    },
    "timeframeResults": {
      "15m": {
        "successful": 4,
        "failed": 0,
        "totalDataPoints": 5000,
        "errors": []
      },
      "1h": {
        "successful": 4,
        "failed": 0,
        "totalDataPoints": 4000,
        "errors": []
      },
      "4h": {
        "successful": 4,
        "failed": 0,
        "totalDataPoints": 3000,
        "errors": []
      },
      "1d": {
        "successful": 4,
        "failed": 0,
        "totalDataPoints": 3000,
        "errors": []
      }
    }
  }
}
```

## 🔧 Tính năng

### 1. **Tự động tính toán ngày**
- Kiểm tra thời gian hiện tại (timezone Việt Nam)
- Tính toán chính xác 252 ngày giao dịch
- Bỏ qua cuối tuần

### 2. **Fetch đa timeframe**
- Tự động fetch cho tất cả timeframes: `15m`, `1h`, `4h`, `1d`
- Tính toán technical indicators cho mỗi timeframe
- Lưu vào database tương ứng

### 3. **Xử lý lỗi thông minh**
- Báo cáo chi tiết cho từng ticker và timeframe
- Tiếp tục xử lý khi có lỗi
- Log chi tiết cho debugging

### 4. **Báo cáo toàn diện**
- Thống kê tổng quan
- Chi tiết theo từng timeframe
- Thông tin về khoảng thời gian

## 📊 Ví dụ thực tế

### Trường hợp 1: Trước 4 PM
```
Thời gian hiện tại: 2024-09-17 14:30 (Thứ 3)
Logic: Bắt đầu từ ngày mai (2024-09-18)
252 ngày giao dịch: 2023-09-18 → 2024-09-17
```

### Trường hợp 2: Sau 4 PM
```
Thời gian hiện tại: 2024-09-17 17:30 (Thứ 3)
Logic: Bao gồm ngày hôm nay
252 ngày giao dịch: 2023-09-18 → 2024-09-17
```

### Trường hợp 3: Cuối tuần
```
Thời gian hiện tại: 2024-09-21 10:00 (Thứ 7)
Logic: Bắt đầu từ Thứ 2 tuần sau (2024-09-23)
252 ngày giao dịch: 2023-09-23 → 2024-09-20
```

## 🧪 Testing

### Test logic tính toán ngày:
```bash
npm run test-trading-days
```

### Test endpoint:
```bash
curl -X POST http://localhost:3333/api/market-data/fetch/trading-days \
  -H "Content-Type: application/json" \
  -d '{
    "tickers": ["VCB", "VIC"],
    "timeframe": "4h"
  }'
```

## ⚠️ Lưu ý quan trọng

### 1. **Thời gian xử lý**
- Endpoint có thể mất vài phút để hoàn thành
- Fetch 4 timeframes × số tickers = nhiều requests
- Có thể gặp rate limit từ FiinQuant

### 2. **Dữ liệu lớn**
- 252 ngày × 4 timeframes × số tickers = rất nhiều data points
- Đảm bảo database có đủ dung lượng
- Monitor memory usage

### 3. **Error handling**
- Một số ticker có thể không có dữ liệu
- Một số timeframe có thể fail
- Check logs để debug

### 4. **Performance**
- Sử dụng batch processing
- Có thể cần tối ưu hóa cho số lượng ticker lớn
- Consider running trong background

## 🔍 Monitoring

### Logs quan trọng:
```
[DataFetchService] Starting 252 trading days data fetch for 4 tickers
[DataFetchService] Date range: 2023-09-18 to 2024-09-17 (252 trading days)
[DataFetchService] Fetching data for timeframe: 15m
[DataFetchService] Successfully processed VCB (15m): 1250 data points
[DataFetchService] Trading days data fetch completed: 16 successful, 0 failed
```

### Metrics cần theo dõi:
- Thời gian xử lý tổng
- Số lượng data points được tạo
- Tỷ lệ thành công theo timeframe
- Memory usage

## 🚀 Sử dụng trong Production

### 1. **Scheduled Job**
```typescript
// Chạy hàng ngày lúc 16:30
@Cron('30 16 * * 1-5')
async dailyTradingDaysFetch() {
  const tickers = await this.getAllTickers();
  await this.dataFetchService.fetchTradingDaysData(tickers);
}
```

### 2. **Manual Trigger**
```bash
# Trigger thủ công
curl -X POST http://localhost:3333/api/market-data/fetch/trading-days \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["VCB", "VIC", "FPT"]}'
```

### 3. **Background Processing**
- Sử dụng queue system (Bull/Redis)
- Chia nhỏ batch processing
- Retry mechanism cho failed requests

## 📈 Use Cases

### 1. **Initial Data Setup**
- Setup dữ liệu ban đầu cho hệ thống
- Fetch 252 ngày giao dịch cho tất cả tickers

### 2. **Data Recovery**
- Khôi phục dữ liệu bị thiếu
- Đồng bộ lại toàn bộ dữ liệu

### 3. **New Ticker Onboarding**
- Thêm ticker mới vào hệ thống
- Fetch dữ liệu lịch sử đầy đủ

### 4. **Data Quality Check**
- Verify dữ liệu có đầy đủ 252 ngày
- Identify gaps trong dữ liệu
