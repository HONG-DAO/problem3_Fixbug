# VITAS Trading System

Hệ thống giao dịch tự động với phân tích kỹ thuật AI-powered, tích hợp FiinQuant API và thông báo real-time. Bao gồm cả backend API (NestJS) và frontend dashboard (React).

## 🚀 Tổng quan dự án

VITAS Trading System là một giải pháp toàn diện cho giao dịch chứng khoán tự động, cung cấp:

- **Backend API** (NestJS/TypeScript): Xử lý dữ liệu thị trường, phân tích kỹ thuật, tạo tín hiệu giao dịch
- **Frontend Dashboard** (React/TypeScript): Giao diện người dùng trực quan với biểu đồ real-time
- **Python Services**: Tích hợp FiinQuant API để lấy dữ liệu thị trường
- **Database**: MongoDB để lưu trữ dữ liệu và Redis cho caching
- **Notifications**: Telegram và Email alerts

## 🌐 Demo

**Frontend Dashboard**: [https://aienthusiasm.vn](https://aienthusiasm.vn)

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   NestJS API    │    │   Python Service│
│   (React/TS)    │◄──►│   (TypeScript)  │◄──►│   (FiinQuant    │
│   Port: 5173    │    │   Port: 3333    │    │    Library)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   Port: 27017   │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Redis Cluster │
                       │   Ports: 6379+  │
                       └─────────────────┘
```

## 📋 Yêu cầu hệ thống

- **Node.js** 18+
- **MongoDB** 4.4+
- **Redis** 6+ (Cluster mode)
- **Python** 3.8+
- **Docker** & **Docker Compose**
- **FiinQuantX** Python Library

## 🛠️ Cài đặt và Khởi chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd vitas
```

### 2. Khởi động Database Services
```bash
cd vitas-be
docker-compose up -d
```

### 3. Cài đặt Backend (vitas-be)
```bash
cd vitas-be

# Cài đặt dependencies
npm install

# Cài đặt Python dependencies
cd python-services
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# hoặc venv\Scripts\activate.bat  # Windows

pip install -r requirements.txt
pip install --extra-index-url https://fiinquant.github.io/fiinquantx/simple fiinquantx

cd ..
```

### 4. Cài đặt Frontend (vitas-fe)
```bash
cd vitas-fe
npm install
```

### 5. Cấu hình Environment Variables

#### Backend (.env trong vitas-be/)
```env
# Database
MONGODB_URI=mongodb://admin:password@localhost:27017/vitas-trading
REDIS_HOST=localhost
REDIS_PORT=6379

# FiinQuant API
FIINQUANT_USERNAME=your_username
FIINQUANT_PASSWORD=your_password

# Trading Strategy
RSI_PERIOD=14
RSI_OVERBOUGHT=70
RSI_OVERSOLD=30
TAKE_PROFIT=0.15
STOP_LOSS=0.08

# Notifications
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=recipient@example.com
```

#### Frontend (.env.local trong vitas-fe/)
```env
VITE_API_URL=http://localhost:3333/api
```

### 6. Khởi động ứng dụng

#### Terminal 1 - Backend
```bash
cd vitas-be
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd vitas-fe
npm run dev
```

### 7. Truy cập ứng dụng
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3333
- **Swagger Documentation**: http://localhost:3333/api/docs

## 🎯 Tính năng chính

### Backend API (vitas-be)
- **Real-time Data**: Lấy dữ liệu thị trường từ FiinQuant API
- **Technical Analysis**: RSI, PSAR, Engulfing patterns
- **Trading Signals**: Tự động tạo tín hiệu mua/bán
- **Risk Management**: Quản lý rủi ro và kích thước vị thế
- **Notifications**: Telegram và Email alerts
- **Scheduler**: Tự động fetch dữ liệu theo lịch trình
- **Multi-timeframe**: Hỗ trợ 15m, 1h, 4h, 1d

### Frontend Dashboard (vitas-fe)
- **Real-time Dashboard**: Tổng quan thị trường với metrics chính
- **Trading Signals**: Hiển thị tín hiệu giao dịch real-time
- **Market Analysis**: 6 kịch bản thị trường
- **Watchlist Management**: Quản lý danh sách theo dõi
- **Interactive Charts**: Biểu đồ candlestick với Chart.js
- **Responsive Design**: Giao diện thân thiện mobile

## 📚 API Endpoints chính

### Market Data
- `GET /api/market-data/query` - Truy vấn dữ liệu thị trường
- `POST /api/market-data/fetch/historical` - Lấy dữ liệu lịch sử
- `POST /api/market-data/fetch/latest` - Lấy dữ liệu mới nhất
- `POST /api/market-data/fetch/incremental` - Xử lý dữ liệu tăng dần

### Trading Analysis
- `POST /api/trading/analysis/ticker` - Phân tích một mã cổ phiếu
- `POST /api/trading/analysis/bulk` - Phân tích nhiều mã cổ phiếu
- `GET /api/trading/strategy/performance` - Hiệu suất chiến lược

### Notifications
- `GET /api/alerts/status` - Trạng thái thông báo
- `POST /api/alerts/test/telegram` - Test Telegram
- `POST /api/alerts/test/email` - Test Email

### Scheduler
- `GET /api/scheduler/status` - Trạng thái scheduler
- `POST /api/scheduler/trigger-fetch` - Trigger fetch thủ công
- `GET /api/scheduler/next-fetch` - Thời gian fetch tiếp theo

## 🔄 Workflow xử lý dữ liệu

### 1. Data Flow
```mermaid
graph TD
    A[FiinQuant API] --> B[Python Service]
    B --> C[NestJS API]
    C --> D[MongoDB]
    C --> E[Redis Cache]
    C --> F[Technical Analysis]
    F --> G[Trading Signals]
    G --> H[Notifications]
    C --> I[Frontend Dashboard]
```

### 2. Trading Strategy (RSI-PSAR-Engulfing)
```mermaid
graph TD
    A[Market Data] --> B[Calculate RSI]
    A --> C[Calculate PSAR]
    A --> D[Detect Engulfing]
    A --> E[Volume Analysis]
    B --> F[Combine Signals]
    C --> F
    D --> F
    E --> F
    F --> G[Risk Management]
    G --> H[Generate Signal]
    H --> I[Send Notification]
```

## 📊 Chiến lược giao dịch

### Tín hiệu MUA
- RSI < 30 (oversold)
- PSAR trend = UP
- Giá > PSAR
- Bullish Engulfing pattern
- Volume anomaly (tăng bất thường)

### Tín hiệu BÁN
- RSI > 70 (overbought)
- PSAR trend = DOWN
- Giá < PSAR
- Bearish Engulfing pattern
- Volume anomaly

### Risk Management
- Stop Loss: 8%
- Take Profit: 15%
- Position Size: 2% portfolio
- Max Positions: 10
- Daily Loss Limit: 5%

## 🎨 Frontend Components

### Dashboard
- Market overview với scenario hiện tại
- Real-time metrics và statistics
- Interactive candlestick charts (1d, 1h timeframes)
- Technical indicators display

### Trading Signals
- Live trading signals với filtering
- Signal details với confidence levels
- Technical analysis indicators
- Real-time updates

### Market Analysis
- 6 market scenarios analysis
- Current market status
- Timeframe-specific analysis
- Risk level indicators

### Watchlist
- Create và manage watchlists
- Add/remove tickers
- Notification channel configuration
- Signal monitoring cho watchlist items

## 🔧 Scripts và Commands

### Backend Scripts
```bash
# Development
npm run dev

# Production
npm run build
npm run start:prod

# Testing
npm run test
npm run test:e2e

# Data Management
npm run fetch:range
npm run check-duplicates
npm run remove-duplicates
npm run test-trading-days
npm run test-market-analysis
```

### Frontend Scripts
```bash
# Development
npm run dev

# Production
npm run build
npm run preview

# Linting
npm run lint
```

## 🐳 Docker Deployment

### Khởi động tất cả services
```bash
cd vitas-be
docker-compose up -d
```

### Services được khởi động
- **MongoDB**: Port 27017
- **Redis Cluster**: Ports 6379, 6380, 6381
- **Backend**: Port 3333 (manual start)
- **Frontend**: Port 5173 (manual start)

## 📈 Monitoring và Logging

### Metrics
- API response times
- Database query performance
- Signal generation accuracy
- Notification delivery rates
- Frontend performance metrics

### Logging
- Structured logging với Winston
- Error tracking và monitoring
- Performance metrics collection
- User activity tracking

## 🔧 Troubleshooting

### Lỗi thường gặp

1. **MongoDB connection failed**
   - Kiểm tra MongoDB đang chạy: `docker ps`
   - Kiểm tra MONGODB_URI trong .env

2. **FiinQuant authentication failed**
   - Kiểm tra username/password
   - Kiểm tra kết nối internet

3. **Python service not responding**
   - Kiểm tra virtual environment
   - Kiểm tra Python dependencies

4. **Frontend không kết nối được API**
   - Kiểm tra VITE_API_URL trong .env.local
   - Kiểm tra backend đang chạy trên port 3333

5. **Redis connection failed**
   - Kiểm tra Redis cluster: `docker ps`
   - Kiểm tra REDIS_HOST và REDIS_PORT

### Debug mode
```bash
# Backend
DEBUG=vitas:* npm run dev

# Frontend
npm run dev -- --debug
```

## 📁 Cấu trúc dự án

```
vitas/
├── vitas-be/                 # Backend API (NestJS)
│   ├── src/
│   │   ├── modules/         # Feature modules
│   │   ├── schemas/         # MongoDB schemas
│   │   ├── common/          # Shared utilities
│   │   └── infrastructure/  # External services
│   ├── python-services/     # Python FiinQuant integration
│   ├── scripts/            # Utility scripts
│   ├── docs/               # API documentation
│   └── docker-compose.yml  # Database services
│
├── vitas-fe/                # Frontend Dashboard (React)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utility functions
│   └── docs/               # Frontend documentation
│
└── README.md               # This file
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## ⚠️ Disclaimer

Hệ thống này chỉ dành cho mục đích giáo dục và nghiên cứu. Không phải lời khuyên đầu tư tài chính. Giao dịch chứng khoán có rủi ro, vui lòng cân nhắc kỹ trước khi đầu tư.

## 🚀 Quick Start Commands

```bash
# 1. Clone và setup
git clone <repo-url>
cd vitas

# 2. Start databases
cd vitas-be && docker-compose up -d

# 3. Setup backend
npm install
cd python-services && pip install -r requirements.txt
cd .. && cp .env.example .env  # Edit .env

# 4. Setup frontend
cd ../vitas-fe
npm install
cp .env.example .env.local  # Edit .env.local

# 5. Start applications
# Terminal 1: Backend
cd vitas-be && npm run dev

# Terminal 2: Frontend  
cd vitas-fe && npm run dev

# 6. Access
# Frontend: http://localhost:5173
# API Docs: http://localhost:3333/api/docs
```
