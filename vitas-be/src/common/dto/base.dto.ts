import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaseQueryDto {
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

  @ApiPropertyOptional({ 
    description: 'Trường để sắp xếp', 
    example: 'timestamp',
    pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$'
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Thứ tự sắp xếp', 
    enum: ['asc', 'desc'], 
    example: 'desc',
    default: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class BaseResponseDto<T> {
  @ApiProperty({ 
    description: 'Trạng thái thành công của request', 
    example: true
  })
  success: boolean;

  @ApiPropertyOptional({ 
    description: 'Thông báo từ server', 
    example: 'Request processed successfully'
  })
  message?: string;

  @ApiPropertyOptional({ 
    description: 'Dữ liệu trả về'
  })
  data?: T;

  @ApiPropertyOptional({ 
    description: 'Thông tin phân trang và metadata',
    example: {
      total: 150,
      page: 1,
      limit: 100,
      hasMore: true
    }
  })
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };

  constructor(success: boolean, data?: T, message?: string, meta?: any) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.meta = meta;
  }

  static success<T>(data?: T, message?: string, meta?: any): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, message, meta);
  }

  static error<T>(message: string, data?: T): BaseResponseDto<T> {
    return new BaseResponseDto(false, data, message);
  }
}
