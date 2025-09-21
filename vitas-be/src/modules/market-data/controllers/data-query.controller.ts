import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MarketDataQueryDto } from '../dto/market-data.dto';
import { BaseResponseDto } from '../../../common/dto/base.dto';
import { DataQueryService } from '../services/data-query.service';

@ApiTags('Market Data - Query')
@Controller('api/market-data/query')
export class DataQueryController {
  private readonly logger = new Logger(DataQueryController.name);

  constructor(private readonly dataQueryService: DataQueryService) {}

  @Get()
  @ApiOperation({
    summary: 'Truy vấn dữ liệu thị trường',
    description: `
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
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dữ liệu thị trường được truy vấn thành công',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: "Market data retrieved successfully",
        data: [
          {
            ticker: "VCB",
            timestamp: "2024-09-15T09:00:00.000Z",
            timeframe: "4h",
            open: 85000,
            high: 87000,
            low: 84000,
            close: 86500,
            volume: 1500000,
            rsi: 45.2,
            psar: 82000,
            psarTrend: "up"
          }
        ],
        meta: {
          total: 150,
          page: 1,
          limit: 100,
          hasMore: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Tham số truy vấn không hợp lệ'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Lỗi server hoặc database'
  })
  async queryMarketData(@Query() query: MarketDataQueryDto) {
    try {
      const result = await this.dataQueryService.queryMarketData(query);
      
      return BaseResponseDto.success(
        result.data, 
        'Market data retrieved successfully',
        {
          total: result.total,
          hasMore: result.hasMore,
          limit: query.limit,
          offset: query.offset
        }
      );
    } catch (error) {
      this.logger.error('Failed to query market data:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('historical/:ticker')
  @ApiOperation({
    summary: 'Lấy dữ liệu lịch sử cho mã cổ phiếu',
    description: `
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
    `
  })
  @ApiParam({ name: 'ticker', description: 'Mã cổ phiếu', example: 'VCB' })
  @ApiQuery({ name: 'timeframe', required: false, example: '4h', description: 'Khung thời gian dữ liệu' })
  @ApiQuery({ name: 'limit', required: false, example: 100, description: 'Số lượng bản ghi tối đa' })
  @ApiQuery({ name: 'fromDate', required: false, example: '2024-01-01', description: 'Ngày bắt đầu (YYYY-MM-DD)' })
  @ApiQuery({ name: 'toDate', required: false, example: '2024-12-31', description: 'Ngày kết thúc (YYYY-MM-DD)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Dữ liệu lịch sử được lấy thành công',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: "Historical data for VCB",
        data: [
          {
            ticker: "VCB",
            timestamp: "2024-09-15T09:00:00.000Z",
            timeframe: "4h",
            open: 85000,
            high: 87000,
            low: 84000,
            close: 86500,
            volume: 1500000,
            rsi: 45.2,
            psar: 82000,
            psarTrend: "up",
            engulfingPattern: 1,
            volumeAnomaly: true
          }
        ]
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Không tìm thấy dữ liệu cho mã cổ phiếu'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Tham số không hợp lệ'
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Lỗi server hoặc database'
  })
  async getHistoricalData(
    @Param('ticker') ticker: string,
    @Query('timeframe') timeframe: string = '4h',
    @Query('limit') limit: string = '100',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    try {
      const data = await this.dataQueryService.getHistoricalData(
        ticker, 
        timeframe, 
        parseInt(limit), 
        fromDate ? new Date(fromDate) : undefined,
        toDate ? new Date(toDate) : undefined
      );
      
      return BaseResponseDto.success(data, `Historical data for ${ticker}`);
    } catch (error) {
      this.logger.error(`Failed to get historical data for ${ticker}:`, error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('latest/:ticker')
  @ApiOperation({
    summary: 'Get latest data for ticker',
    description: 'Get the most recent market data for a specific ticker'
  })
  @ApiParam({ name: 'ticker', description: 'Stock symbol', example: 'VCB' })
  @ApiQuery({ name: 'timeframe', required: false, example: '4h' })
  @ApiResponse({ 
    status: 200, 
    description: 'Latest data retrieved successfully',
    type: BaseResponseDto
  })
  async getLatestData(
    @Param('ticker') ticker: string,
    @Query('timeframe') timeframe: string = '4h'
  ) {
    try {
      const data = await this.dataQueryService.getLatestData(ticker, timeframe);
      
      return BaseResponseDto.success(data, `Latest data for ${ticker}`);
    } catch (error) {
      this.logger.error(`Failed to get latest data for ${ticker}:`, error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('ohlcv/:ticker')
  @ApiOperation({
    summary: 'Get OHLCV data for ticker',
    description: 'Get OHLCV candlestick data for charting'
  })
  @ApiParam({ name: 'ticker', description: 'Stock symbol', example: 'VCB' })
  @ApiQuery({ name: 'timeframe', required: false, example: '4h' })
  @ApiQuery({ name: 'limit', required: false, example: 100 })
  @ApiResponse({ 
    status: 200, 
    description: 'OHLCV data retrieved successfully',
    type: BaseResponseDto
  })
  async getOHLCVData(
    @Param('ticker') ticker: string,
    @Query('timeframe') timeframe: string = '4h',
    @Query('limit') limit: string = '100'
  ) {
    try {
      const data = await this.dataQueryService.getOHLCVData(ticker, timeframe, parseInt(limit));
      
      return BaseResponseDto.success(data, `OHLCV data for ${ticker}`);
    } catch (error) {
      this.logger.error(`Failed to get OHLCV data for ${ticker}:`, error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get market statistics',
    description: 'Get overall market statistics and metrics for specific timeframe'
  })
  @ApiQuery({ name: 'hours', required: false, example: 24 })
  @ApiQuery({ name: 'timeframe', required: false, example: '4h' })
  @ApiResponse({ 
    status: 200, 
    description: 'Market statistics retrieved successfully',
    type: BaseResponseDto
  })
  async getMarketStatistics(
    @Query('hours') hours: string = '24',
    @Query('timeframe') timeframe: string = '4h'
  ) {
    try {
      const stats = await this.dataQueryService.getMarketStatistics(parseInt(hours), timeframe);
      
      return BaseResponseDto.success(stats, 'Market statistics retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get market statistics:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('all-tickers')
  @ApiOperation({
    summary: 'Get all available tickers',
    description: 'Get list of all available stock tickers from FiinQuant'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'All tickers retrieved successfully',
    type: BaseResponseDto
  })
  async getAllTickers() {
    try {
      const tickers = await this.dataQueryService.getAllTickers();
      
      return BaseResponseDto.success({ 
        tickers, 
        count: tickers.length 
      }, 'All tickers retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get all tickers:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('collections')
  @ApiOperation({
    summary: 'Get collection information',
    description: 'Get information about all timeframe collections and their document counts'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Collection information retrieved successfully',
    type: BaseResponseDto
  })
  async getCollectionInfo() {
    try {
      const info = await this.dataQueryService.getCollectionInfo();
      
      return BaseResponseDto.success(info, 'Collection information retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get collection info:', error);
      return BaseResponseDto.error(error.message);
    }
  }
}
