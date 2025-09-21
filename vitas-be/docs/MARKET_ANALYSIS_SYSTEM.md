# Hệ Thống Phân Tích Thị Trường VITAS

## Tổng Quan

Hệ thống phân tích thị trường VITAS được thiết kế để tự động phân tích tình hình thị trường chứng khoán Việt Nam và gửi thông báo real-time qua nhiều kênh khác nhau.

## Kiến Trúc Hệ Thống

### 1. Các Module Chính

- **MarketAnalysisModule**: Phân tích 6 kịch bản thị trường
- **DashboardModule**: API endpoints cho React dashboard
- **NotificationsModule**: Quản lý thông báo đa kênh
- **SchedulerModule**: Tự động fetch data và phân tích

### 2. Các Service Chính

#### MarketAnalysisService
- Phân tích 6 kịch bản thị trường dựa trên các chỉ số kỹ thuật
- Tính toán các tỷ lệ: BUY/SELL signals, RSI, PSAR, Volume, Engulfing patterns
- Xác định kịch bản thị trường hiện tại

#### UserWatchlistService
- Quản lý danh sách theo dõi cho từng kênh (Telegram, Dashboard)
- Hỗ trợ single-user system với userId = 'default'
- Tách biệt watchlist cho Telegram và Dashboard

#### NotificationService
- Gửi thông báo qua Telegram cho các ticker được theo dõi
- Lưu dữ liệu và signals vào database cho Dashboard
- Gửi email tổng hợp hàng ngày

#### DashboardController
- API endpoints cho React frontend
- Real-time data cho charts và signals
- Quản lý watchlist và preferences

## 6 Kịch Bản Thị Trường

### Kịch Bản 1: THỊ TRƯỜNG TĂNG MẠNH (BULLISH MARKET)
- **Điều kiện**: BUY > 60%, RSI < 50 > 70%, PSAR UP > 65%, Volume tăng > 20%, Bullish Engulfing > 40%
- **Khuyến nghị**: Tích cực tìm kiếm cơ hội mua vào

### Kịch Bản 2: THỊ TRƯỜNG GIẢM MẠNH (BEARISH MARKET)
- **Điều kiện**: SELL > 50%, RSI > 50 > 70%, PSAR DOWN > 60%, Volume tăng > 15%, Bearish Engulfing > 35%
- **Khuyến nghị**: Thận trọng, ưu tiên bảo toàn vốn

### Kịch Bản 3: THỊ TRƯỜNG SIDEWAY (NEUTRAL MARKET)
- **Điều kiện**: BUY 30-50%, SELL 30-50%, RSI 40-60, Volume thay đổi < 10%, Engulfing < 30%
- **Khuyến nghị**: Chọn lọc từng cổ phiếu cụ thể

### Kịch Bản 4: THỊ TRƯỜNG BIẾN ĐỘNG CAO (HIGH VOLATILITY)
- **Điều kiện**: Tổng signals > 80%, Volume anomaly > 70%, Engulfing > 60%, RSI extreme nhiều
- **Khuyến nghị**: Quản lý rủi ro nghiêm ngặt, giảm kích thước lệnh

### Kịch Bản 5: THỊ TRƯỜNG PHỤC HỒI
- **Điều kiện**: BUY tăng từ < 30% lên > 45%, RSI phục hồi, PSAR reversal > 40%, Volume mua > bán
- **Khuyến nghị**: Cân nhắc gia tăng positions từ từ

### Kịch Bản 6: THỊ TRƯỜNG RỦI RO CAO (HIGH RISK ALERT)
- **Điều kiện**: Risk warning > 40%, RSI extreme > 50%, Volume anomaly > 60%, Engulfing + PSAR reversal
- **Khuyến nghị**: DỪNG giao dịch mới, review portfolio

## Luồng Hoạt Động

### 1. Scheduled Data Fetching
- Chạy mỗi phút (nhưng chỉ thực thi logic fetch vào giờ chẵn 5 phút)
- Fetch data cho tất cả timeframes: 15m, 1h, 4h, 1d
- Lặp lại 3 lần mỗi giờ để tránh mất data
- Chỉ chạy từ 9h-15h, thứ 2-6

### 2. Market Analysis
- Ngay sau khi fetch data xong
- Tính toán các chỉ số kỹ thuật
- Phân tích 6 kịch bản thị trường
- Tạo market overview

### 3. Notifications
- **Telegram**: Gửi signals cho tickers trong watchlist
- **Dashboard**: Lưu data và signals vào database
- **Email**: Gửi tổng hợp hàng ngày (nếu đúng giờ)

## API Endpoints

### Dashboard APIs
- `GET /api/dashboard/market-overview`: Tổng quan thị trường
- `GET /api/dashboard/signals`: Signals cho dashboard
- `GET /api/dashboard/ohlcv/:ticker`: Dữ liệu OHLCV cho chart
- `POST /api/dashboard/watchlist/add`: Thêm ticker vào watchlist
- `DELETE /api/dashboard/watchlist/remove`: Xóa ticker khỏi watchlist
- `GET /api/dashboard/watchlist`: Lấy danh sách watchlist
- `PUT /api/dashboard/watchlist/preferences`: Cập nhật preferences

### Market Analysis APIs
- `POST /api/notifications/test-market-analysis`: Test phân tích thị trường

## Cấu Hình

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=vitas

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM_NAME=VITAS Trading System
```

### Watchlist Configuration
- **Telegram Watchlist**: Các ticker sẽ nhận thông báo qua Telegram
- **Dashboard Watchlist**: Các ticker hiển thị trên dashboard
- Mỗi kênh có thể có danh sách ticker riêng biệt

## Testing

### Test Scripts
```bash
# Test market analysis
npm run test:market-analysis

# Test scheduler
npm run test:scheduler

# Test trading days calculation
npm run test:trading-days
```

### Manual Testing
```bash
# Test market analysis endpoint
curl -X POST http://localhost:3333/api/notifications/test-market-analysis \
  -H "Content-Type: application/json" \
  -d '{"tickers": ["VCB", "VIC", "FPT"]}'
```

## Lưu Ý Quan Trọng

1. **Single User System**: Hệ thống được thiết kế cho 1 user duy nhất với userId = 'default'
2. **Watchlist Separation**: Telegram và Dashboard có watchlist riêng biệt
3. **Daily Signals**: Chỉ lấy signals trong ngày hiện tại
4. **Real-time Updates**: Dashboard cần implement WebSocket để nhận updates real-time
5. **Error Handling**: Tất cả services đều có error handling và logging

## Tương Lai

- [ ] WebSocket support cho real-time dashboard
- [ ] Mobile app integration
- [ ] Advanced charting features
- [ ] Portfolio tracking
- [ ] Risk management tools