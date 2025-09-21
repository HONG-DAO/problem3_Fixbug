import { IsOptional, IsArray, IsString, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefetchMissingOpensDto {
  @ApiPropertyOptional({ 
    description: 'Danh sách collections cần xử lý', 
    example: ['stock-ss1m', 'stock-ss15m', 'stock-ss1h', 'stock-ss4h', 'stock-ss1d'],
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[] = ['stock-ss1m', 'stock-ss15m', 'stock-ss1h', 'stock-ss4h', 'stock-ss1d'];

  @ApiPropertyOptional({ 
    description: 'Ngày bắt đầu tìm kiếm (YYYY-MM-DD)', 
    example: '2025-01-15'
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ 
    description: 'Ngày kết thúc tìm kiếm (YYYY-MM-DD)', 
    example: '2025-01-19'
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ 
    description: 'Giới hạn số documents xử lý mỗi collection', 
    example: 1000,
    minimum: 1,
    maximum: 10000
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  @Type(() => Number)
  limit?: number = 1000;

  @ApiPropertyOptional({ 
    description: 'Số lượng refetch đồng thời', 
    example: 5,
    minimum: 1,
    maximum: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  concurrency?: number = 5;

  @ApiPropertyOptional({ 
    description: 'Chế độ dry-run (chỉ kiểm tra, không cập nhật DB)', 
    example: false
  })
  @IsOptional()
  dryRun?: boolean = false;
}

export class RefetchResultDto {
  @ApiProperty({ description: 'Tên collection' })
  collection: string;

  @ApiProperty({ description: 'Số documents đã quét' })
  scanned: number;

  @ApiProperty({ description: 'Số lần refetch' })
  refetch: number;

  @ApiProperty({ description: 'Số documents đã sửa thành công' })
  fixed: number;

  @ApiProperty({ description: 'Số documents bỏ qua' })
  skipped: number;

  @ApiProperty({ description: 'Số lỗi' })
  errors: number;

  @ApiProperty({ description: 'Chi tiết lỗi' })
  errorDetails: string[];
}

export class RefetchSummaryDto {
  @ApiProperty({ description: 'Tổng số documents đã quét' })
  totalScanned: number;

  @ApiProperty({ description: 'Tổng số lần refetch' })
  totalRefetch: number;

  @ApiProperty({ description: 'Tổng số documents đã sửa' })
  totalFixed: number;

  @ApiProperty({ description: 'Tổng số documents bỏ qua' })
  totalSkipped: number;

  @ApiProperty({ description: 'Tổng số lỗi' })
  totalErrors: number;

  @ApiProperty({ description: 'Kết quả theo từng collection', type: [RefetchResultDto] })
  results: RefetchResultDto[];

  @ApiProperty({ description: 'Thời gian xử lý (ms)' })
  processingTimeMs: number;
}
