# Data Models & DTOs Documentation

## 1. Market Data Models

### 1.1 Market Data Point
```typescript
interface IMarketDataPoint {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ticker: string;                    // Mã cổ phiếu
  timestamp: Date;                   // Thời gian của dữ liệu
  timeframe: string;                 // Khung thời gian (15m, 1h, 4h, 1d)
  open: number;                      // Giá mở cửa (VND)
  high: number;                      // Giá cao nhất trong phiên (VND)
  low: number;                       // Giá thấp nhất trong phiên (VND)
  close: number;                     // Giá đóng cửa (VND)
  volume: number;                    // Khối lượng giao dịch
  change?: number;                   // Thay đổi giá so với phiên trước (VND)
  changePercent?: number;            // Phần trăm thay đổi giá (%)
  totalMatchValue?: number;          // Tổng giá trị khớp lệnh (VND)
  foreignBuyVolume?: number;         // Khối lượng mua của nhà đầu tư nước ngoài
  foreignSellVolume?: number;        // Khối lượng bán của nhà đầu tư nước ngoài
  matchVolume?: number;              // Khối lượng khớp lệnh
  
  // Technical Indicators
  rsi?: number;                      // Relative Strength Index
  psar?: number;                     // Parabolic SAR value
  psarTrend?: string;                // PSAR trend (up/down)
  engulfingPattern?: number;         // Engulfing pattern signal (-1, 0, 1)
  volumeAnomaly?: boolean;           // Volume anomaly detection
  priceVsPsar?: boolean;             // Price above/below PSAR
  avgVolume20?: number;              // 20-period average volume
}
```

### 1.2 Market Data DTOs

#### CreateMarketDataDto
```typescript
class CreateMarketDataDto {
  ticker: string;                    // Mã cổ phiếu (ticker symbol)
  timestamp: string;                 // Thời gian của dữ liệu (ISO 8601 format)
  timeframe: string;                 // Khung thời gian của dữ liệu
  open: number;                      // Giá mở cửa (VND)
  high: number;                      // Giá cao nhất trong phiên (VND)
  low: number;                       // Giá thấp nhất trong phiên (VND)
  close: number;                     // Giá đóng cửa (VND)
  volume: number;                    // Khối lượng giao dịch
  change?: number;                   // Thay đổi giá so với phiên trước (VND)
  changePercent?: number;            // Phần trăm thay đổi giá (%)
  totalMatchValue?: number;          // Tổng giá trị khớp lệnh (VND)
  foreignBuyVolume?: number;         // Khối lượng mua của nhà đầu tư nước ngoài
  foreignSellVolume?: number;        // Khối lượng bán của nhà đầu tư nước ngoài
  matchVolume?: number;              // Khối lượng khớp lệnh
}
```

#### QueryMarketDataDto
```typescript
class QueryMarketDataDto {
  ticker?: string;                   // Lọc theo mã cổ phiếu cụ thể
  tickers?: string[];                // Lọc theo danh sách mã cổ phiếu
  timeframe?: string;                // Khung thời gian dữ liệu
  startDate?: string;                // Ngày bắt đầu (YYYY-MM-DD)
  endDate?: string;                  // Ngày kết thúc (YYYY-MM-DD)
  limit?: number;                    // Số lượng bản ghi trả về
  offset?: number;                   // Số lượng bản ghi bỏ qua (phân trang)
}
```

#### FetchDataDto
```typescript
class FetchDataDto {
  tickers: string[];                 // Danh sách mã cổ phiếu cần lấy dữ liệu
  timeframe?: string;                // Khung thời gian dữ liệu
  periods?: number;                  // Số chu kỳ dữ liệu cần lấy
  fromDate?: string;                 // Ngày bắt đầu lấy dữ liệu (YYYY-MM-DD)
  toDate?: string;                   // Ngày kết thúc lấy dữ liệu (YYYY-MM-DD)
}
```

#### FetchDataTradingDayDto
```typescript
class FetchDataTradingDayDto {
  tickers: string[];                 // Danh sách mã cổ phiếu cần lấy dữ liệu 252 ngày giao dịch
  timeframe?: string;                // Khung thời gian dữ liệu
}
```

#### GetLatestDataDto
```typescript
class GetLatestDataDto {
  tickers: string[];                 // Danh sách mã cổ phiếu cần lấy dữ liệu mới nhất
  timeframe?: string;                // Khung thời gian dữ liệu
}
```

#### UpdateIndicatorsDto
```typescript
class UpdateIndicatorsDto {
  ticker: string;                    // Mã cổ phiếu cần cập nhật chỉ số kỹ thuật
  timeframe?: string;                // Khung thời gian dữ liệu
  recalculate?: boolean;             // Bắt buộc tính lại chỉ số kỹ thuật
}
```

#### CleanupDataDto
```typescript
class CleanupDataDto {
  days?: number;                     // Số ngày dữ liệu cần giữ lại
}
```

## 2. Trading Signal Models

### 2.1 Trading Signal
```typescript
interface ITradingSignal {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ticker: string;                    // Mã cổ phiếu
  timestamp: Date;                   // Thời gian tạo tín hiệu
  signalType: 'buy' | 'sell' | 'risk_warning';  // Loại tín hiệu giao dịch
  confidence: number;                // Mức độ tin cậy của tín hiệu (0-1)
  entryPrice: number;                // Giá vào lệnh (VND)
  stopLoss?: number;                 // Giá cắt lỗ (VND)
  takeProfit?: number;               // Giá chốt lời (VND)
  reason: string;                    // Lý do tạo tín hiệu
  metadata?: Record<string, any>;    // Dữ liệu bổ sung
  timeframe?: string;                // Khung thời gian của tín hiệu
  indicators?: ITechnicalIndicators; // Các chỉ số kỹ thuật tại thời điểm tạo tín hiệu
}
```

### 2.2 Technical Indicators
```typescript
interface ITechnicalIndicators {
  rsi?: number;                      // Relative Strength Index
  psar?: number;                     // Parabolic SAR value
  psarTrend?: string;                // PSAR trend (up/down)
  engulfingPattern?: number;         // Engulfing pattern signal (-1, 0, 1)
  volumeAnomaly?: boolean;           // Volume anomaly detection
  priceVsPsar?: boolean;             // Price above/below PSAR
  avgVolume20?: number;              // 20-period average volume
}
```

### 2.3 Trading Signal DTOs

#### CreateTradingSignalDto
```typescript
class CreateTradingSignalDto {
  ticker: string;                    // Mã cổ phiếu
  timestamp: string;                 // Thời gian tạo tín hiệu (ISO 8601 format)
  signalType: 'buy' | 'sell' | 'risk_warning';  // Loại tín hiệu giao dịch
  confidence: number;                // Mức độ tin cậy của tín hiệu (0-1)
  entryPrice: number;                // Giá vào lệnh (VND)
  stopLoss?: number;                 // Giá cắt lỗ (VND)
  takeProfit?: number;               // Giá chốt lời (VND)
  reason: string;                    // Lý do tạo tín hiệu
  metadata?: Record<string, any>;    // Dữ liệu bổ sung
  timeframe?: string;                // Khung thời gian của tín hiệu
  indicators?: ITechnicalIndicators; // Các chỉ số kỹ thuật tại thời điểm tạo tín hiệu
}
```

#### QueryTradingSignalsDto
```typescript
class QueryTradingSignalsDto {
  ticker?: string;                   // Lọc theo mã cổ phiếu
  signalType?: 'buy' | 'sell' | 'risk_warning';  // Lọc theo loại tín hiệu
  startDate?: string;                // Ngày bắt đầu tìm kiếm (YYYY-MM-DD)
  endDate?: string;                  // Ngày kết thúc tìm kiếm (YYYY-MM-DD)
  limit?: number;                    // Số lượng tín hiệu trả về
  offset?: number;                   // Số lượng tín hiệu bỏ qua (phân trang)
  minConfidence?: number;            // Mức độ tin cậy tối thiểu
}
```

## 3. Trading Analysis Models

### 3.1 Strategy State
```typescript
interface IStrategyState {
  ticker: string;                    // Mã cổ phiếu
  lastUpdate: Date;                  // Lần cập nhật cuối
  currentPrice: number;              // Giá hiện tại
  positionStatus: 'none' | 'long' | 'short';  // Trạng thái vị thế
  entryPrice?: number;               // Giá vào lệnh
  entryDate?: Date;                  // Ngày vào lệnh
  unrealizedPnl: number;             // Lãi/lỗ chưa thực hiện
  maxPriceSinceEntry: number;        // Giá cao nhất kể từ khi vào lệnh
  trailingStopPrice?: number;        // Giá trailing stop
  lastSignalType?: string;           // Loại tín hiệu cuối
  lastSignalTime?: Date;             // Thời gian tín hiệu cuối
}
```

### 3.2 Risk Metrics
```typescript
interface IRiskMetrics {
  totalPortfolioValue: number;       // Tổng giá trị danh mục đầu tư
  totalExposure: number;             // Tổng giá trị exposure
  dailyPnl: number;                  // Lãi/lỗ trong ngày
  dailyDrawdown: number;             // Drawdown trong ngày
  activePositionsCount: number;      // Số vị thế đang mở
  riskLimitUsage: number;            // Tỷ lệ sử dụng giới hạn rủi ro
  maxPositionSize: number;           // Kích thước vị thế tối đa
  diversificationScore: number;      // Điểm đa dạng hóa
}
```

### 3.3 Trading Analysis DTOs

#### AnalyzeTickerDto
```typescript
class AnalyzeTickerDto {
  ticker: string;                    // Mã cổ phiếu cần phân tích kỹ thuật
  periods?: number;                  // Số chu kỳ dữ liệu để phân tích (càng nhiều càng chính xác)
}
```

#### AnalyzeBulkDto
```typescript
class AnalyzeBulkDto {
  tickers: string[];                 // Danh sách mã cổ phiếu cần phân tích kỹ thuật hàng loạt
  periods?: number;                  // Số chu kỳ dữ liệu để phân tích cho mỗi mã
}
```

#### CalculatePositionSizeDto
```typescript
class CalculatePositionSizeDto {
  ticker: string;                    // Mã cổ phiếu cần tính kích thước vị thế
  entryPrice: number;                // Giá vào lệnh (VND)
  stopLossPrice: number;             // Giá cắt lỗ (VND)
  portfolioValue: number;            // Tổng giá trị danh mục đầu tư (VND)
}
```

#### TradingQueryDto
```typescript
class TradingQueryDto {
  ticker?: string;                   // Lọc theo mã cổ phiếu
  timeframe?: string;                // Lọc theo khung thời gian
  limit?: number;                    // Số lượng bản ghi trả về
  offset?: number;                   // Số lượng bản ghi bỏ qua (phân trang)
  sortBy?: string;                   // Trường để sắp xếp
  sortOrder?: 'asc' | 'desc';       // Thứ tự sắp xếp
}
```

## 4. Base Models

### 4.1 Base Entity
```typescript
interface IBaseEntity {
  _id?: string;                      // MongoDB ObjectId
  createdAt?: Date;                  // Thời gian tạo
  updatedAt?: Date;                  // Thời gian cập nhật
}
```

### 4.2 Base Query
```typescript
interface IBaseQuery {
  limit?: number;                    // Số lượng bản ghi trả về
  offset?: number;                   // Số lượng bản ghi bỏ qua (phân trang)
  sortBy?: string;                   // Trường để sắp xếp
  sortOrder?: 'asc' | 'desc';       // Thứ tự sắp xếp
}
```

### 4.3 Base Response
```typescript
interface IBaseResponse<T> {
  success: boolean;                  // Trạng thái thành công của request
  message?: string;                  // Thông báo từ server
  data?: T;                         // Dữ liệu trả về
  meta?: {                          // Thông tin phân trang và metadata
    total?: number;                  // Tổng số bản ghi
    page?: number;                   // Trang hiện tại
    limit?: number;                  // Số bản ghi mỗi trang
    hasMore?: boolean;               // Còn dữ liệu không
  };
}
```

### 4.4 Base DTOs

#### BaseQueryDto
```typescript
class BaseQueryDto {
  limit?: number;                    // Số lượng bản ghi trả về
  offset?: number;                   // Số lượng bản ghi bỏ qua (phân trang)
  sortBy?: string;                   // Trường để sắp xếp
  sortOrder?: 'asc' | 'desc';       // Thứ tự sắp xếp
}
```

#### BaseResponseDto
```typescript
class BaseResponseDto<T> {
  success: boolean;                  // Trạng thái thành công của request
  message?: string;                  // Thông báo từ server
  data?: T;                         // Dữ liệu trả về
  meta?: {                          // Thông tin phân trang và metadata
    total?: number;                  // Tổng số bản ghi
    page?: number;                   // Trang hiện tại
    limit?: number;                  // Số bản ghi mỗi trang
    hasMore?: boolean;               // Còn dữ liệu không
  };

  constructor(success: boolean, data?: T, message?: string, meta?: any);
  static success<T>(data?: T, message?: string, meta?: any): BaseResponseDto<T>;
  static error<T>(message: string, data?: T): BaseResponseDto<T>;
}
```

## 5. Indicator Models

### 5.1 Indicator Result
```typescript
interface IIndicatorResult {
  values: number[];                  // Mảng giá trị chỉ số
  signals?: number[];                // Mảng tín hiệu (nếu có)
  metadata?: Record<string, any>;    // Metadata bổ sung
}
```

### 5.2 Indicator Parameters

#### RSI Parameters
```typescript
interface RSIParameters {
  period: number;                    // Chu kỳ tính toán (default: 14)
  overbought: number;                // Ngưỡng quá mua (default: 70)
  oversold: number;                  // Ngưỡng quá bán (default: 30)
  neutral: number;                   // Ngưỡng trung tính (default: 50)
}
```

#### PSAR Parameters
```typescript
interface PSARParameters {
  afInit: number;                    // Hệ số tăng tốc ban đầu (default: 0.02)
  afStep: number;                    // Bước tăng hệ số tăng tốc (default: 0.02)
  afMax: number;                     // Hệ số tăng tốc tối đa (default: 0.20)
}
```

#### Engulfing Parameters
```typescript
interface EngulfingParameters {
  detectionWindow: number;           // Cửa sổ phát hiện (default: 2)
  minBodyRatio: number;              // Tỷ lệ thân nến tối thiểu (default: 0.5)
  lookbackCandles: number;           // Số nến nhìn lại (default: 3)
}
```

#### Volume Parameters
```typescript
interface VolumeParameters {
  avgPeriod: number;                 // Chu kỳ trung bình (default: 20)
  anomalyThreshold: number;          // Ngưỡng bất thường (default: 1.0)
}
```

## 6. Configuration Models

### 6.1 Trading Strategy Configuration
```typescript
interface TradingStrategyConfig {
  name: string;                      // Tên chiến lược
  rsi: RSIParameters;               // Tham số RSI
  psar: PSARParameters;             // Tham số PSAR
  engulfing: EngulfingParameters;   // Tham số Engulfing
  volume: VolumeParameters;         // Tham số Volume
}
```

### 6.2 Risk Management Configuration
```typescript
interface RiskManagementConfig {
  takeProfit: number;                // Tỷ lệ chốt lời (default: 0.15)
  stopLoss: number;                  // Tỷ lệ cắt lỗ (default: 0.08)
  trailingTakeProfit: number;        // Tỷ lệ trailing take profit (default: 0.09)
  trailingStop: number;              // Tỷ lệ trailing stop (default: 0.03)
  positionSize: number;              // Kích thước vị thế (default: 0.02)
  maxPositions: number;              // Số vị thế tối đa (default: 10)
  maxDailyLoss: number;              // Tổn thất tối đa trong ngày (default: 0.05)
}
```

### 6.3 Market Configuration
```typescript
interface MarketConfig {
  exchanges: string[];               // Danh sách sàn giao dịch
  tradingHours: {                    // Giờ giao dịch
    start: string;                   // Giờ bắt đầu
    end: string;                     // Giờ kết thúc
    timezone: string;                // Múi giờ
  };
  filters: {                         // Bộ lọc thị trường
    minPrice: number;                // Giá tối thiểu
    maxPrice: number;                // Giá tối đa
    minVolume: number;               // Khối lượng tối thiểu
    minMarketCap: number;            // Vốn hóa tối thiểu
  };
}
```

## 7. Notification Models

### 7.1 Telegram Configuration
```typescript
interface TelegramConfig {
  enabled: boolean;                  // Bật/tắt Telegram
  botToken: string;                  // Token của bot
  chatId: string;                    // ID chat
  debounceMinutes: number;           // Thời gian debounce (phút)
  maxAlertsPerHour: number;          // Số alert tối đa mỗi giờ
}
```

### 7.2 Email Configuration
```typescript
interface EmailConfig {
  enabled: boolean;                  // Bật/tắt Email
  smtp: {                           // Cấu hình SMTP
    host: string;                    // Host SMTP
    port: number;                    // Port SMTP
    secure: boolean;                 // Sử dụng SSL/TLS
    auth: {                         // Xác thực
      user: string;                  // Username
      pass: string;                  // Password
    };
  };
  from: string;                      // Email gửi
  to: string[];                      // Danh sách email nhận
  debounceMinutes: number;           // Thời gian debounce (phút)
  maxEmailsPerHour: number;          // Số email tối đa mỗi giờ
  dailySummaryTime: string;          // Thời gian gửi daily summary
}
```

### 7.3 Alert Types Configuration
```typescript
interface AlertTypesConfig {
  buySignal: boolean;                // Bật/tắt tín hiệu mua
  sellSignal: boolean;               // Bật/tắt tín hiệu bán
  riskWarning: boolean;              // Bật/tắt cảnh báo rủi ro
  volumeAnomaly: boolean;            // Bật/tắt cảnh báo volume bất thường
  dailySummary: boolean;             // Bật/tắt tóm tắt hàng ngày
  portfolioUpdate: boolean;          // Bật/tắt cập nhật portfolio
}
```

## 8. Database Models

### 8.1 Performance Metrics
```typescript
interface PerformanceMetrics {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  date: Date;                        // Ngày
  totalSignals: number;              // Tổng số tín hiệu
  buySignals: number;                // Số tín hiệu mua
  sellSignals: number;               // Số tín hiệu bán
  riskWarnings: number;              // Số cảnh báo rủi ro
  tradesOpened: number;              // Số giao dịch mở
  tradesClosed: number;              // Số giao dịch đóng
  totalPnl: number;                  // Tổng lãi/lỗ
  winRate?: number;                  // Tỷ lệ thắng
  avgTradeDuration?: number;         // Thời gian giao dịch trung bình
  maxDrawdown?: number;              // Drawdown tối đa
  portfolioValue?: number;           // Giá trị danh mục
  avgConfidence?: number;            // Độ tin cậy trung bình
  additionalMetrics?: Record<string, any>;  // Metrics bổ sung
}
```

### 8.2 System Log
```typescript
interface SystemLog {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  timestamp: Date;                   // Thời gian log
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';  // Mức độ log
  component: string;                 // Component tạo log
  message: string;                   // Nội dung log
  details?: Record<string, any>;     // Chi tiết bổ sung
  sessionId?: string;                // ID session
  userId?: string;                   // ID user
  context?: Record<string, any>;     // Context bổ sung
}
```

### 8.3 Trade
```typescript
interface Trade {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ticker: string;                    // Mã cổ phiếu
  entryDate: Date;                   // Ngày vào lệnh
  exitDate?: Date;                   // Ngày thoát lệnh
  entryPrice: number;                // Giá vào lệnh
  exitPrice?: number;                // Giá thoát lệnh
  quantity: number;                  // Số lượng
  tradeType: 'long' | 'short';      // Loại giao dịch
  status: 'open' | 'closed' | 'cancelled';  // Trạng thái
  pnlAmount?: number;                // Số tiền lãi/lỗ
  pnlPercent?: number;               // Phần trăm lãi/lỗ
  maxPriceReached?: number;          // Giá cao nhất đạt được
  minPriceReached?: number;          // Giá thấp nhất đạt được
  stopLossPrice?: number;            // Giá cắt lỗ
  takeProfitPrice?: number;          // Giá chốt lời
  exitReason?: string;               // Lý do thoát lệnh
  metadata?: Record<string, any>;    // Metadata bổ sung
}
```

### 8.4 User Watchlist
```typescript
interface UserWatchlist {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;                    // ID user
  tickers: string[];                 // Danh sách mã cổ phiếu theo dõi
  notificationChannels: string[];    // Kênh thông báo (telegram, email, dashboard)
  isActive: boolean;                 // Trạng thái hoạt động
  lastUpdated: Date;                 // Lần cập nhật cuối
}
```

## 9. Market Analysis Models

### 9.1 Market Scenario
```typescript
interface MarketScenario {
  name: string;                      // Tên kịch bản
  description: string;               // Mô tả kịch bản
  recommendation: string;            // Khuyến nghị
  riskLevel: 'low' | 'medium' | 'high' | 'critical';  // Mức độ rủi ro
  conditions: {                      // Điều kiện kịch bản
    buySignalRatio: { min: number; max?: number; };     // Tỷ lệ tín hiệu mua
    sellSignalRatio: { min: number; max?: number; };    // Tỷ lệ tín hiệu bán
    rsiBelow50Ratio: { min: number; max?: number; };    // Tỷ lệ RSI < 50
    psarUptrendRatio: { min: number; max?: number; };   // Tỷ lệ PSAR uptrend
    volumeIncrease: { min: number; max?: number; };     // Tăng trưởng volume
    bullishEngulfingRatio: { min: number; max?: number; };  // Tỷ lệ bullish engulfing
  };
}
```

### 9.2 Market Overview
```typescript
interface MarketOverview {
  scenario: MarketScenario;          // Kịch bản thị trường hiện tại
  conditions: {                      // Điều kiện thực tế
    buySignalRatio: number;          // Tỷ lệ tín hiệu mua thực tế
    sellSignalRatio: number;         // Tỷ lệ tín hiệu bán thực tế
    rsiBelow50Ratio: number;         // Tỷ lệ RSI < 50 thực tế
    psarUptrendRatio: number;        // Tỷ lệ PSAR uptrend thực tế
    volumeIncrease: number;          // Tăng trưởng volume thực tế
    bullishEngulfingRatio: number;   // Tỷ lệ bullish engulfing thực tế
  };
  statistics: {                      // Thống kê
    totalTickers: number;            // Tổng số mã
    analyzedTickers: number;         // Số mã đã phân tích
    signalsGenerated: number;        // Số tín hiệu được tạo
    highConfidenceSignals: number;   // Số tín hiệu độ tin cậy cao
  };
  topPerformers: Array<{             // Top performers
    ticker: string;
    signalType: string;
    confidence: number;
    price: number;
    change: number;
    changePercent: number;
  }>;
  analysisDate: Date;                // Thời gian phân tích
}
```

### 9.3 Notification Result
```typescript
interface NotificationResult {
  channel: 'telegram' | 'email' | 'dashboard';  // Kênh thông báo
  success: boolean;                  // Thành công hay không
  message?: string;                  // Thông báo thành công
  error?: string;                    // Lỗi nếu có
  timestamp: Date;                   // Thời gian gửi
}
```

## 10. Validation Rules

### 10.1 Common Validation
- **ticker**: Pattern `^[A-Z0-9]{3,10}$` (3-10 ký tự chữ hoa và số)
- **timeframe**: Enum `['15m', '1h', '4h', '1d']`
- **signalType**: Enum `['buy', 'sell', 'risk_warning']`
- **confidence**: Range `[0, 1]`
- **price**: Minimum `0`
- **date**: ISO 8601 format `YYYY-MM-DD` hoặc `YYYY-MM-DDTHH:mm:ss.sssZ`
- **limit**: Range `[1, 1000]`
- **offset**: Minimum `0`

### 10.2 Required Fields
- **Market Data**: ticker, timestamp, timeframe, open, high, low, close, volume
- **Trading Signal**: ticker, timestamp, signalType, confidence, entryPrice, reason
- **Analysis**: ticker, periods (optional)
- **Risk Management**: ticker, entryPrice, stopLossPrice, portfolioValue

### 10.3 Optional Fields
- Tất cả các trường có dấu `?` trong interface
- Các trường có giá trị default trong DTO
- Metadata và context fields

