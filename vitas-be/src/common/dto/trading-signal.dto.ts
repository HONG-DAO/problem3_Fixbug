import { IsString, IsNumber, IsEnum, IsOptional, IsObject, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTradingSignalDto {
  @ApiProperty({ 
    description: 'Mã cổ phiếu', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsString()
  ticker: string;

  @ApiProperty({ 
    description: 'Thời gian tạo tín hiệu (ISO 8601 format)', 
    example: '2024-09-15T09:30:00.000Z'
  })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ 
    description: 'Loại tín hiệu giao dịch', 
    example: 'buy',
    enum: ['buy', 'sell', 'risk_warning']
  })
  @IsEnum(['buy', 'sell', 'risk_warning'])
  signalType: 'buy' | 'sell' | 'risk_warning';

  @ApiProperty({ 
    description: 'Mức độ tin cậy của tín hiệu (0-1)', 
    example: 0.85,
    minimum: 0,
    maximum: 1
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ 
    description: 'Giá vào lệnh (VND)', 
    example: 85000,
    minimum: 0
  })
  @IsNumber()
  entryPrice: number;

  @ApiPropertyOptional({ 
    description: 'Giá cắt lỗ (VND)', 
    example: 78000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @ApiPropertyOptional({ 
    description: 'Giá chốt lời (VND)', 
    example: 95000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  takeProfit?: number;

  @ApiProperty({ 
    description: 'Lý do tạo tín hiệu', 
    example: 'RSI oversold + PSAR uptrend + bullish engulfing pattern'
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ 
    description: 'Dữ liệu bổ sung', 
    example: { 
      rsi: 28.5, 
      psarTrend: 'up', 
      volumeAnomaly: true 
    }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Khung thời gian của tín hiệu', 
    example: '4h',
    enum: ['15m', '1h', '4h', '1d'],
    default: '4h'
  })
  @IsOptional()
  @IsString()
  timeframe?: string;

  @ApiPropertyOptional({ 
    description: 'Các chỉ số kỹ thuật tại thời điểm tạo tín hiệu', 
    example: {
      rsi: 28.5,
      psar: 82000,
      psarTrend: 'up',
      engulfingPattern: 1,
      volumeAnomaly: true,
      priceVsPsar: true
    }
  })
  @IsOptional()
  @IsObject()
  indicators?: {
    rsi?: number;
    psar?: number;
    psarTrend?: string;
    engulfingPattern?: number;
    volumeAnomaly?: boolean;
    priceVsPsar?: boolean;
  };
}

export class QueryTradingSignalsDto {
  @ApiPropertyOptional({ 
    description: 'Lọc theo mã cổ phiếu', 
    example: 'VCB',
    pattern: '^[A-Z0-9]{3,10}$'
  })
  @IsOptional()
  @IsString()
  ticker?: string;

  @ApiPropertyOptional({ 
    description: 'Lọc theo loại tín hiệu', 
    example: 'buy',
    enum: ['buy', 'sell', 'risk_warning']
  })
  @IsOptional()
  @IsEnum(['buy', 'sell', 'risk_warning'])
  signalType?: 'buy' | 'sell' | 'risk_warning';

  @ApiPropertyOptional({ 
    description: 'Ngày bắt đầu tìm kiếm (YYYY-MM-DD)', 
    example: '2024-09-01'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Ngày kết thúc tìm kiếm (YYYY-MM-DD)', 
    example: '2024-09-15'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Số lượng tín hiệu trả về', 
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
    description: 'Số lượng tín hiệu bỏ qua (phân trang)', 
    example: 0,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offset?: number = 0;

  @ApiPropertyOptional({ 
    description: 'Mức độ tin cậy tối thiểu', 
    example: 0.7,
    minimum: 0,
    maximum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence?: number;
}
