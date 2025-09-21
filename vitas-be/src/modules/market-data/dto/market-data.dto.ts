import { IsString, IsArray, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from '../../../common/dto/base.dto';

export class FetchDataDto {
  @ApiProperty({ 
    description: 'Array of stock symbols', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({ description: 'Data timeframe', example: '4h' })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';

  @ApiPropertyOptional({ description: 'Number of periods', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  periods?: number = 100;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)', example: '2024-09-15' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)', example: '2025-09-15' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class FetchDataTradingDayDto {
  @ApiProperty({ 
    description: 'Array of stock symbols', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({ description: 'Data timeframe', example: '4h' })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';
}

export class GetLatestDataDto {
  @ApiProperty({ 
    description: 'Array of stock symbols', 
    example: ['VCB', 'VIC', 'FPT'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({ description: 'Data timeframe', example: '4h' })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';
}

export class UpdateIndicatorsDto {
  @ApiProperty({ description: 'Stock symbol', example: 'VCB' })
  @IsString()
  ticker: string;

  @ApiPropertyOptional({ description: 'Data timeframe', example: '4h' })
  @IsOptional()
  @IsString()
  timeframe?: string = '4h';

  @ApiPropertyOptional({ description: 'Force recalculation', example: false })
  @IsOptional()
  recalculate?: boolean = false;
}

export class MarketDataQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Filter by ticker', example: 'VCB' })
  @IsOptional()
  @IsString()
  ticker?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple tickers', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tickers?: string[];

  @ApiPropertyOptional({ description: 'Filter by timeframe', example: '15m' })
  @IsOptional()
  @IsString()
  timeframe?: string = '15m';

  @ApiPropertyOptional({ description: 'Start date', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CleanupDataDto {
  @ApiPropertyOptional({ description: 'Days to keep', example: 30, minimum: 1, maximum: 365 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30;
}
