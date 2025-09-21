import { Controller, Post, Body, Get, Delete, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base.dto';
import { BacktestService } from './backtest.service';
import { RunBacktestDto, BacktestSummaryDto } from './dto/backtest.dto';

@ApiTags('Backtest')
@Controller('api/backtest')
export class BacktestController {
  private readonly logger = new Logger(BacktestController.name);

  constructor(private readonly backtestService: BacktestService) {}

  @Post('run')
  @ApiOperation({
    summary: 'Chạy backtest cho các mã cổ phiếu',
    description: `
      **Chức năng**: Chạy backtest để giả lập dữ liệu realtime cho hệ thống trading.
      
      **Cách hoạt động**:
      1. Lấy dữ liệu lịch sử theo ticker và timeframe
      2. Lặp qua từng candle theo thứ tự thời gian
      3. Với mỗi candle, gọi AnalysisService để phân tích và sinh tín hiệu
      4. Lưu tín hiệu vào database và gửi notification (nếu không phải dry run)
      5. Có delay giả lập realtime để mô phỏng tốc độ thực tế
      
      **Lưu ý**:
      - Nếu backtest đang chạy, sẽ trả về lỗi
      - Có thể hủy backtest đang chạy bằng DELETE /api/backtest/cancel
      - Dry run mode chỉ log ra console, không lưu DB hay gửi notification
    `,
  })
  @ApiBody({ type: RunBacktestDto })
  @ApiResponse({
    status: 200,
    description: 'Backtest chạy thành công',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Backtest completed successfully',
        data: {
          totalTickers: 3,
          totalCandles: 3000,
          totalSignals: 35,
          totalProcessingTimeMs: 120000,
          overallStatus: 'completed',
          results: [
            {
              ticker: 'VCB',
              totalCandles: 1000,
              buySignals: 15,
              sellSignals: 12,
              riskWarnings: 8,
              processingTimeMs: 45000,
              firstSignalTime: '2025-03-15T09:30:00.000Z',
              lastSignalTime: '2025-03-19T20:00:00.000Z',
              status: 'completed'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Backtest đang chạy hoặc có lỗi validation',
    type: BaseResponseDto,
    schema: {
      example: {
        success: false,
        message: 'Backtest is already running',
        data: null
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi server khi chạy backtest',
    type: BaseResponseDto,
    schema: {
      example: {
        success: false,
        message: 'Failed to run backtest',
        data: {
          error: 'Database connection failed'
        }
      }
    }
  })
  async runBacktest(@Body() dto: RunBacktestDto): Promise<BaseResponseDto<BacktestSummaryDto>> {
    this.logger.log(`Received backtest request: ${JSON.stringify(dto)}`);
    
    try {
      const result = await this.backtestService.runBacktest(dto);
      
      return BaseResponseDto.success(
        result,
        `Backtest completed successfully. Processed ${result.totalCandles} candles and generated ${result.totalSignals} signals.`
      );
    } catch (error) {
      this.logger.error('Failed to run backtest:', error);
      
      return BaseResponseDto.error(
        'Failed to run backtest',
        {
          error: error.message,
          details: error.stack,
        } as any
      );
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Lấy trạng thái backtest hiện tại',
    description: 'Kiểm tra xem có backtest nào đang chạy không và lấy ID của backtest đó.',
  })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái backtest',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Backtest status retrieved',
        data: {
          isRunning: true,
          currentBacktestId: 'backtest_1703123456789'
        }
      }
    }
  })
  async getStatus(): Promise<BaseResponseDto<{ isRunning: boolean; currentBacktestId: string | null }>> {
    try {
      const status = this.backtestService.getStatus();
      
      return BaseResponseDto.success(
        status,
        status.isRunning ? 'Backtest is currently running' : 'No backtest is running'
      );
    } catch (error) {
      this.logger.error('Failed to get backtest status:', error);
      
      return BaseResponseDto.error(
        'Failed to get backtest status',
        {
          error: error.message,
        } as any
      );
    }
  }

  @Get('config')
  @ApiOperation({
    summary: 'Lấy cấu hình backtest từ environment',
    description: 'Hiển thị cấu hình backtest hiện tại từ các biến môi trường.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cấu hình backtest',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Backtest configuration retrieved',
        data: {
          enabled: true,
          tickers: ['VCB', 'FPT', 'VIC'],
          timeframe: '15m',
          speed: 50,
          dryRun: false
        }
      }
    }
  })
  async getConfig(): Promise<BaseResponseDto<any>> {
    try {
      const config = this.backtestService.getConfig();
      
      return BaseResponseDto.success(
        config,
        'Backtest configuration retrieved successfully'
      );
    } catch (error) {
      this.logger.error('Failed to get backtest config:', error);
      
      return BaseResponseDto.error(
        'Failed to get backtest configuration',
        {
          error: error.message,
        } as any
      );
    }
  }

  @Delete('cancel')
  @ApiOperation({
    summary: 'Hủy backtest đang chạy',
    description: 'Hủy bỏ backtest hiện tại đang chạy (nếu có).',
  })
  @ApiResponse({
    status: 200,
    description: 'Backtest đã được hủy hoặc không có backtest nào đang chạy',
    type: BaseResponseDto,
    schema: {
      example: {
        success: true,
        message: 'Backtest cancelled successfully',
        data: {
          cancelled: true
        }
      }
    }
  })
  async cancelBacktest(): Promise<BaseResponseDto<{ cancelled: boolean }>> {
    try {
      const cancelled = await this.backtestService.cancelBacktest();
      
      return BaseResponseDto.success(
        { cancelled },
        cancelled ? 'Backtest cancelled successfully' : 'No backtest was running'
      );
    } catch (error) {
      this.logger.error('Failed to cancel backtest:', error);
      
      return BaseResponseDto.error(
        'Failed to cancel backtest',
        {
          error: error.message,
        } as any
      );
    }
  }

  @Post('run-auto')
  @ApiOperation({
    summary: 'Chạy backtest tự động với cấu hình từ environment',
    description: 'Chạy backtest sử dụng cấu hình từ các biến môi trường (BACKTEST_TICKERS, BACKTEST_TIMEFRAME, etc.).',
  })
  @ApiResponse({
    status: 200,
    description: 'Backtest tự động chạy thành công',
    type: BaseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Backtest không được bật hoặc đang chạy',
    type: BaseResponseDto,
  })
  async runAutoBacktest(): Promise<BaseResponseDto<BacktestSummaryDto>> {
    try {
      const config = this.backtestService.getConfig();
      
      if (!config.enabled) {
        return BaseResponseDto.error(
          'Backtest is not enabled',
          {
            config,
          } as any
        );
      }

      const dto: RunBacktestDto = {
        tickers: config.tickers,
        timeframe: config.timeframe,
        speed: config.speed,
        dryRun: config.dryRun,
      };

      this.logger.log(`Running auto backtest with config: ${JSON.stringify(dto)}`);
      
      const result = await this.backtestService.runBacktest(dto);
      
      return BaseResponseDto.success(
        result,
        `Auto backtest completed successfully. Processed ${result.totalCandles} candles and generated ${result.totalSignals} signals.`
      );
    } catch (error) {
      this.logger.error('Failed to run auto backtest:', error);
      
      return BaseResponseDto.error(
        'Failed to run auto backtest',
        {
          error: error.message,
          details: error.stack,
        } as any
      );
    }
  }
}
