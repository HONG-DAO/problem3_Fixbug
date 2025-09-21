import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FetchDataDto, GetLatestDataDto, FetchDataTradingDayDto } from '../dto/market-data.dto';
import { BaseResponseDto,  } from '../../../common/dto/base.dto';
import { DataFetchService } from '../services/data-fetch.service';

@ApiTags('Market Data - Fetch')
@Controller('api/market-data/fetch')
export class DataFetchController {
  private readonly logger = new Logger(DataFetchController.name);

  constructor(private readonly dataFetchService: DataFetchService) {}

  @Post('historical')
  @ApiOperation({
    summary: 'Lấy dữ liệu thị trường lịch sử',
    description: `
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
    `
  })
  @ApiBody({ type: FetchDataDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Dữ liệu lịch sử được lấy thành công',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: "Historical data fetch completed: 45/50 successful",
        data: {
          totalTickers: 50,
          successfulTickers: 45,
          failedTickers: 5,
          totalDataPoints: 4500,
          timeframeResults: {
            "4h": {
              successful: 45,
              failed: 5,
              totalDataPoints: 4500,
              errors: []
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu đầu vào không hợp lệ',
    schema: {
      example: {
        success: false,
        message: "Validation failed",
        data: {
          errors: ["tickers must be an array", "periods must be between 1 and 1000"]
        }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Lỗi server hoặc kết nối FiinQuant',
    schema: {
      example: {
        success: false,
        message: "Failed to fetch data from FiinQuant API"
      }
    }
  })
  async fetchHistoricalData(@Body() dto: FetchDataDto) {
    try {
      const { tickers, timeframe = '4h', periods, fromDate, toDate } = dto;
      this.logger.log(`Fetching historical data for ${tickers.length} tickers`);
      
      const results = await this.dataFetchService.fetchAndSaveHistoricalData(
        tickers, timeframe, periods, fromDate, toDate
      );
      
      return BaseResponseDto.success(results, 
        `Historical data fetch completed: ${results.successfulTickers}/${results.totalTickers} successful`,
        { 
          total: results.totalTickers, 
          successful: results.successfulTickers, 
          totalDataPoints: results.totalDataPoints 
        }
      );
    } catch (error) {
      this.logger.error('Failed to fetch historical data:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Post('latest')
  @ApiOperation({
    summary: 'Lấy dữ liệu thị trường mới nhất',
    description: `
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
    `
  })
  @ApiBody({ type: GetLatestDataDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Dữ liệu mới nhất được lấy thành công',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: "Latest data fetched successfully",
        data: {
          totalTickers: 3,
          successfulTickers: 3,
          failedTickers: 0,
          totalDataPoints: 3,
          results: {
            "VCB": {
              ticker: "VCB",
              timestamp: "2024-09-15T09:30:00.000Z",
              open: 85000,
              high: 87000,
              low: 84000,
              close: 86500,
              volume: 1500000,
              rsi: 45.2,
              psar: 82000,
              psarTrend: "up"
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu đầu vào không hợp lệ'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Lỗi kết nối FiinQuant hoặc server'
  })
  async fetchLatestData(@Body() dto: GetLatestDataDto) {
    try {
      const { tickers, timeframe } = dto;
      this.logger.log(`Fetching latest data for ${tickers.length} tickers`);
      
      const results = await this.dataFetchService.fetchLatestData(tickers, timeframe);
      
      return BaseResponseDto.success(results, 'Latest data fetched successfully');
    } catch (error) {
      this.logger.error('Failed to fetch latest data:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Post('incremental')
  @ApiOperation({
    summary: 'Lấy dữ liệu tăng trưởng',
    description: `
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
    `
  })
  @ApiBody({ type: GetLatestDataDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Dữ liệu tăng trưởng được lấy thành công',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: "Incremental data fetched successfully",
        data: {
          totalTickers: 5,
          results: [
            {
              ticker: "VCB",
              success: true,
              newDataPoints: 12,
              latestPrice: 86500,
              message: "Successfully processed 12 new data points"
            }
          ],
          totalNewDataPoints: 45
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu đầu vào không hợp lệ'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Lỗi server hoặc kết nối FiinQuant'
  })
  async fetchIncrementalData(@Body() dto: GetLatestDataDto) {
    try {
      const { tickers, timeframe } = dto;
      this.logger.log(`Fetching incremental data for ${tickers.length} tickers`);
      
      const results = await this.dataFetchService.fetchIncrementalData(tickers, timeframe);
      
      return BaseResponseDto.success(results, 'Incremental data fetched successfully');
    } catch (error) {
      this.logger.error('Failed to fetch incremental data:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Post('trading-days')
  @ApiOperation({
    summary: 'Lấy dữ liệu 252 ngày giao dịch',
    description: `
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
    `
  })
  @ApiBody({ type: FetchDataTradingDayDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Dữ liệu 252 ngày giao dịch được lấy thành công',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: "Trading days data fetch completed: 45/50 successful",
        data: {
          totalTickers: 50,
          successfulTickers: 45,
          failedTickers: 5,
          totalDataPoints: 56700,
          tradingDays: 252,
          dateRange: {
            startDate: "2023-09-15",
            endDate: "2024-09-15"
          },
          timeframeResults: {
            "15m": { successful: 45, failed: 5, totalDataPoints: 22680 },
            "1h": { successful: 45, failed: 5, totalDataPoints: 5670 },
            "4h": { successful: 45, failed: 5, totalDataPoints: 1417 },
            "1d": { successful: 45, failed: 5, totalDataPoints: 45 }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu đầu vào không hợp lệ'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Lỗi server hoặc kết nối FiinQuant'
  })
  async fetchTradingDaysData(@Body() dto: FetchDataTradingDayDto) {
    try {
      const { tickers, timeframe } = dto;
      this.logger.log(`Fetching 252 trading days data for ${tickers.length} tickers`);
      
      const results = await this.dataFetchService.fetchTradingDaysData(tickers, timeframe);
      
      return BaseResponseDto.success(results, 
        `Trading days data fetch completed: ${results.successfulTickers}/${results.totalTickers} successful`,
        { 
          total: results.totalTickers, 
          successful: results.successfulTickers, 
          totalDataPoints: results.totalDataPoints,
          tradingDays: results.tradingDays,
          dateRange: results.dateRange
        }
      );
    } catch (error) {
      this.logger.error('Failed to fetch trading days data:', error);
      return BaseResponseDto.error(error.message);
    }
  }
}
