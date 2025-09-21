import { IsString, IsNumber, IsDateString, IsOptional, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from './base.dto';

export class CreateMarketDataDto {
  @ApiProperty({ 
    description: 'Mã cổ phiếu (ticker symbol)', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsString()
  ticker: string;

  @ApiProperty({ 
    description: 'Thời gian của dữ liệu (ISO 8601 format)', 
    example: '2024-09-15T09:00:00.000Z'
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ 
    description: 'Khung thời gian của dữ liệu', 
    example: '4h',
    enum: ['1m', '15m', '1h', '4h', '1d']
  })
  @IsString()
  timeframe: string;

  @ApiProperty({ 
    description: 'Giá mở cửa (VND)', 
    example: 85000,
    minimum: 0
  })
  @IsNumber()
  open: number;

  @ApiProperty({ 
    description: 'Giá cao nhất trong phiên (VND)', 
    example: 87000,
    minimum: 0
  })
  @IsNumber()
  high: number;

  @ApiProperty({ 
    description: 'Giá thấp nhất trong phiên (VND)', 
    example: 84000,
    minimum: 0
  })
  @IsNumber()
  low: number;

  @ApiProperty({ 
    description: 'Giá đóng cửa (VND)', 
    example: 86500,
    minimum: 0
  })
  @IsNumber()
  close: number;

  @ApiProperty({ 
    description: 'Khối lượng giao dịch', 
    example: 1500000,
    minimum: 0
  })
  @IsNumber()
  volume: number;

  @ApiPropertyOptional({ 
    description: 'Thay đổi giá so với phiên trước (VND)', 
    example: 1500
  })
  @IsOptional()
  @IsNumber()
  change?: number;

  @ApiPropertyOptional({ 
    description: 'Phần trăm thay đổi giá (%)', 
    example: 1.76
  })
  @IsOptional()
  @IsNumber()
  changePercent?: number;

  @ApiPropertyOptional({ 
    description: 'Tổng giá trị khớp lệnh (VND)', 
    example: 129750000000
  })
  @IsOptional()
  @IsNumber()
  totalMatchValue?: number;

  @ApiPropertyOptional({ 
    description: 'Khối lượng mua của nhà đầu tư nước ngoài', 
    example: 500000
  })
  @IsOptional()
  @IsNumber()
  foreignBuyVolume?: number;

  @ApiPropertyOptional({ 
    description: 'Khối lượng bán của nhà đầu tư nước ngoài', 
    example: 300000
  })
  @IsOptional()
  @IsNumber()
  foreignSellVolume?: number;

  @ApiPropertyOptional({ 
    description: 'Khối lượng khớp lệnh', 
    example: 1200000
  })
  @IsOptional()
  @IsNumber()
  matchVolume?: number;
}

export class QueryMarketDataDto {
  @ApiPropertyOptional({ 
    description: 'Lọc theo mã cổ phiếu cụ thể', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsOptional()
  @IsString()
  ticker?: string;

  @ApiPropertyOptional({ 
    description: 'Lọc theo danh sách mã cổ phiếu', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tickers?: string[];

  @ApiPropertyOptional({ 
    description: 'Khung thời gian dữ liệu', 
    example: '4h',
    enum: ['1m', '15m', '1h', '4h', '1d'],
    default: '4h'
  })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';

  @ApiPropertyOptional({ 
    description: 'Ngày bắt đầu (YYYY-MM-DD)', 
    example: '2024-09-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Ngày kết thúc (YYYY-MM-DD)', 
    example: '2024-09-15'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Số lượng bản ghi trả về', 
    example: 100,
    minimum: 1,
    maximum: 1000,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 100;

  @ApiPropertyOptional({ 
    description: 'Số lượng bản ghi bỏ qua (phân trang)', 
    example: 0,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number = 0;
}

export class FetchDataDto {
  @ApiProperty({ 
    description: 'Danh sách mã cổ phiếu cần lấy dữ liệu', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String],
    minItems: 1,
    maxItems: 100
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({ 
    description: 'Khung thời gian dữ liệu', 
    example: '4h',
    enum: ['1m', '15m', '1h', '4h', '1d'],
    default: '4h'
  })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';

  @ApiPropertyOptional({ 
    description: 'Số chu kỳ dữ liệu cần lấy', 
    example: 100,
    minimum: 1,
    maximum: 1000,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  periods?: number = 100;

  @ApiPropertyOptional({ 
    description: 'Ngày bắt đầu lấy dữ liệu (YYYY-MM-DD)', 
    example: '2024-09-15'
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ 
    description: 'Ngày kết thúc lấy dữ liệu (YYYY-MM-DD)', 
    example: '2025-09-15'
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class FetchDataTradingDayDto {
  @ApiProperty({ 
    description: 'Danh sách mã cổ phiếu cần lấy dữ liệu 252 ngày giao dịch', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String],
    minItems: 1,
    maxItems: 100
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({ 
    description: 'Khung thời gian dữ liệu', 
    example: '4h',
    enum: ['1m', '15m', '1h', '4h', '1d'],
    default: '4h'
  })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';
}

export class GetLatestDataDto {
  @ApiProperty({ 
    description: 'Danh sách mã cổ phiếu cần lấy dữ liệu mới nhất', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String],
    minItems: 1,
    maxItems: 100
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({ 
    description: 'Khung thời gian dữ liệu', 
    example: '4h',
    enum: ['1m', '15m', '1h', '4h', '1d'],
    default: '4h'
  })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';
}

export class UpdateIndicatorsDto {
  @ApiProperty({ 
    description: 'Mã cổ phiếu cần cập nhật chỉ số kỹ thuật', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsString()
  ticker: string;

  @ApiPropertyOptional({ 
    description: 'Khung thời gian dữ liệu', 
    example: '4h',
    enum: ['1m', '15m', '1h', '4h', '1d'],
    default: '4h'
  })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';

  @ApiPropertyOptional({ 
    description: 'Bắt buộc tính lại chỉ số kỹ thuật', 
    example: false,
    default: false
  })
  @IsOptional()
  recalculate?: boolean = false;
}

export class MarketDataQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ 
    description: 'Lọc theo mã cổ phiếu cụ thể', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsOptional()
  @IsString()
  ticker?: string;

  @ApiPropertyOptional({ 
    description: 'Lọc theo danh sách mã cổ phiếu', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tickers?: string[];

  @ApiPropertyOptional({ 
    description: 'Khung thời gian dữ liệu', 
    example: '15m',
    enum: ['1m', '15m', '1h', '4h', '1d'],
    default: '15m'
  })
  @IsOptional()
  @IsString()
  timeframe?: string = '15m';

  @ApiPropertyOptional({ 
    description: 'Ngày bắt đầu', 
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Ngày kết thúc', 
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CleanupDataDto {
  @ApiPropertyOptional({ 
    description: 'Số ngày dữ liệu cần giữ lại', 
    example: 30,
    minimum: 1,
    maximum: 365,
    default: 30
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30;
}
