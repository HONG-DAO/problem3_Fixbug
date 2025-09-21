import { IsArray, IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RunBacktestDto {
  @ApiProperty({
    description: 'Danh sách mã cổ phiếu cần backtest',
    example: ['VCB', 'FPT', 'VIC'],
    type: [String],
    minItems: 1,
    maxItems: 10,
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({
    description: 'Khung thời gian dữ liệu',
    example: '15m',
    enum: ['1m', '15m', '1h', '4h', '1d'],
    default: '15m',
  })
  @IsOptional()
  @IsString()
  timeframe?: string = '15m';

  @ApiPropertyOptional({
    description: 'Số lượng candles tối đa để backtest',
    example: 1000,
    minimum: 10,
    maximum: 10000,
    default: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(10)
  @Max(10000)
  limit?: number = 1000;

  @ApiPropertyOptional({
    description: 'Tốc độ replay (ms per candle)',
    example: 50,
    minimum: 0,
    maximum: 5000,
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(5000)
  speed?: number = 50;

  @ApiPropertyOptional({
    description: 'Chế độ dry run (không gửi notification)',
    example: false,
    default: false,
  })
  @IsOptional()
  dryRun?: boolean = false;
}

export class BacktestResultDto {
  @ApiProperty({ description: 'Ticker được backtest', example: 'VCB' })
  ticker: string;

  @ApiProperty({ description: 'Tổng số candles đã xử lý', example: 1000 })
  totalCandles: number;

  @ApiProperty({ description: 'Số tín hiệu buy được tạo', example: 15 })
  buySignals: number;

  @ApiProperty({ description: 'Số tín hiệu sell được tạo', example: 12 })
  sellSignals: number;

  @ApiProperty({ description: 'Số cảnh báo rủi ro', example: 8 })
  riskWarnings: number;

  @ApiProperty({ description: 'Thời gian xử lý (ms)', example: 45000 })
  processingTimeMs: number;

  @ApiProperty({ description: 'Tín hiệu đầu tiên', example: '2024-01-15T09:30:00.000Z' })
  firstSignalTime?: string;

  @ApiProperty({ description: 'Tín hiệu cuối cùng', example: '2024-01-19T15:00:00.000Z' })
  lastSignalTime?: string;

  @ApiProperty({ description: 'Trạng thái hoàn thành', example: 'completed' })
  status: 'completed' | 'failed' | 'cancelled';
}

export class BacktestSummaryDto {
  @ApiProperty({ description: 'Tổng số tickers được backtest', example: 3 })
  totalTickers: number;

  @ApiProperty({ description: 'Tổng số candles đã xử lý', example: 3000 })
  totalCandles: number;

  @ApiProperty({ description: 'Tổng số tín hiệu được tạo', example: 35 })
  totalSignals: number;

  @ApiProperty({ description: 'Tổng thời gian xử lý (ms)', example: 120000 })
  totalProcessingTimeMs: number;

  @ApiProperty({ description: 'Kết quả chi tiết cho từng ticker', type: [BacktestResultDto] })
  results: BacktestResultDto[];

  @ApiProperty({ description: 'Trạng thái tổng thể', example: 'completed' })
  overallStatus: 'completed' | 'failed' | 'cancelled';
}
