import { IsString, IsArray, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../common/dto/base.dto';

export class AnalyzeTickerDto {
  @ApiProperty({ 
    description: 'Mã cổ phiếu cần phân tích kỹ thuật', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsString()
  ticker: string;

  @ApiPropertyOptional({ 
    description: 'Số chu kỳ dữ liệu để phân tích (càng nhiều càng chính xác)', 
    example: 100, 
    minimum: 10, 
    maximum: 1000,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  periods?: number = 100;
}

export class AnalyzeBulkDto {
  @ApiProperty({ 
    description: 'Danh sách mã cổ phiếu cần phân tích kỹ thuật hàng loạt', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String],
    minItems: 1,
    maxItems: 50
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({ 
    description: 'Số chu kỳ dữ liệu để phân tích cho mỗi mã', 
    example: 100, 
    minimum: 10, 
    maximum: 1000,
    default: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  periods?: number = 100;
}

export class CalculatePositionSizeDto {
  @ApiProperty({ 
    description: 'Mã cổ phiếu cần tính kích thước vị thế', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsString()
  ticker: string;

  @ApiProperty({ 
    description: 'Giá vào lệnh (VND)', 
    example: 85000,
    minimum: 0
  })
  @IsNumber()
  entryPrice: number;

  @ApiProperty({ 
    description: 'Giá cắt lỗ (VND)', 
    example: 78000,
    minimum: 0
  })
  @IsNumber()
  stopLossPrice: number;

  @ApiProperty({ 
    description: 'Tổng giá trị danh mục đầu tư (VND)', 
    example: 1000000000,
    minimum: 0
  })
  @IsNumber()
  portfolioValue: number;
}

export class TradingQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ 
    description: 'Lọc theo mã cổ phiếu', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsOptional()
  @IsString()
  ticker?: string;

  @ApiPropertyOptional({ 
    description: 'Lọc theo khung thời gian', 
    example: '15m',
    enum: ['15m', '1h', '4h', '1d'],
    default: '15m'
  })
  @IsOptional()
  @IsString()
  timeframe?: string = '15m';
}
