import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RefetchMissingOpensService } from '../services/refetch-missing-opens.service';
import { RefetchMissingOpensDto, RefetchSummaryDto } from '../dto/refetch-missing-opens.dto';
import { BaseResponseDto } from '../../../common/dto/base.dto';

@ApiTags('Market Data - Refetch Missing Opens')
@Controller('market-data/refetch-missing-opens')
export class RefetchMissingOpensController {
  private readonly logger = new Logger(RefetchMissingOpensController.name);

  constructor(
    private readonly refetchService: RefetchMissingOpensService,
  ) {}

  @Post()
  @ApiOperation({ 
    summary: 'Refetch missing opens',
    description: `
      Tìm và refetch các data point có open = 0 từ các collection MongoDB.
      
      **Quy trình:**
      1. Tìm các documents có open = 0, null, hoặc không tồn tại
      2. Gọi Python fiinquant_fetcher.py để fetch lại dữ liệu chính xác
      3. Nếu open > 0 sau khi refetch, cập nhật vào database
      4. Trả về thống kê chi tiết về quá trình xử lý
      
      **Collections hỗ trợ:**
      - stock-ss1m (1 phút)
      - stock-ss15m (15 phút) 
      - stock-ss1h (1 giờ)
      - stock-ss4h (4 giờ)
      - stock-ss1d (1 ngày)
      
      **Lưu ý:**
      - Sử dụng dryRun=true để kiểm tra mà không cập nhật DB
      - Concurrency mặc định là 5 để tránh quá tải
      - Timeout 25 giây cho mỗi lần gọi Python
    `
  })
  @ApiBody({ 
    type: RefetchMissingOpensDto,
    description: 'Tham số refetch missing opens',
    examples: {
      'basic': {
        summary: 'Refetch cơ bản',
        description: 'Refetch tất cả collections với giới hạn 1000 documents',
        value: {
          collections: ['stock-ss1m', 'stock-ss15m'],
          limit: 1000,
          concurrency: 5,
          dryRun: false
        }
      },
      'time-range': {
        summary: 'Refetch theo khoảng thời gian',
        description: 'Refetch chỉ trong khoảng thời gian cụ thể',
        value: {
          collections: ['stock-ss1m', 'stock-ss15m', 'stock-ss1h'],
          fromDate: '2025-01-15',
          toDate: '2025-01-19',
          limit: 500,
          concurrency: 3,
          dryRun: true
        }
      },
      'dry-run': {
        summary: 'Dry run test',
        description: 'Chỉ kiểm tra mà không cập nhật database',
        value: {
          collections: ['stock-ss1m'],
          limit: 10,
          concurrency: 2,
          dryRun: true
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Refetch thành công',
    type: RefetchSummaryDto,
    schema: {
      example: {
        success: true,
        message: 'Refetch missing opens completed successfully',
        data: {
          totalScanned: 5000,
          totalRefetch: 800,
          totalFixed: 650,
          totalSkipped: 150,
          totalErrors: 0,
          processingTimeMs: 45000,
          results: [
            {
              collection: 'stock-ss1m',
              scanned: 2000,
              refetch: 400,
              fixed: 350,
              skipped: 50,
              errors: 0,
              errorDetails: []
            },
            {
              collection: 'stock-ss15m',
              scanned: 1500,
              refetch: 200,
              fixed: 150,
              skipped: 50,
              errors: 0,
              errorDetails: []
            }
          ]
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
        message: 'Validation failed',
        data: {
          statusCode: 400,
          message: ['collections must be an array', 'limit must be a number'],
          error: 'Bad Request'
        }
      }
    }
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi server khi xử lý refetch',
    schema: {
      example: {
        success: false,
        message: 'Failed to refetch missing opens',
        data: {
          error: 'Python script execution failed',
          details: 'Connection timeout'
        }
      }
    }
  })
  async refetchMissingOpens(@Body() dto: RefetchMissingOpensDto): Promise<BaseResponseDto<RefetchSummaryDto>> {
    try {
      this.logger.log(`Starting refetch missing opens process with params:`, {
        collections: dto.collections,
        fromDate: dto.fromDate,
        toDate: dto.toDate,
        limit: dto.limit,
        concurrency: dto.concurrency,
        dryRun: dto.dryRun
      });

      const result = await this.refetchService.refetchMissingOpens(dto);

      this.logger.log(`Refetch process completed successfully:`, {
        totalScanned: result.totalScanned,
        totalRefetch: result.totalRefetch,
        totalFixed: result.totalFixed,
        totalSkipped: result.totalSkipped,
        totalErrors: result.totalErrors,
        processingTimeMs: result.processingTimeMs
      });

      return BaseResponseDto.success(
        result,
        `Refetch missing opens completed successfully. Fixed ${result.totalFixed} documents out of ${result.totalScanned} scanned.`
      );

    } catch (error) {
      this.logger.error('Failed to refetch missing opens:', error);
      
      return BaseResponseDto.error(
        'Failed to refetch missing opens',
        {
          error: error.message,
          details: error.stack
        } as any
      );
    }
  }

  @Post('dry-run')
  @ApiOperation({ 
    summary: 'Dry run refetch missing opens',
    description: 'Chạy refetch ở chế độ dry-run để kiểm tra mà không cập nhật database'
  })
  @ApiBody({ 
    type: RefetchMissingOpensDto,
    description: 'Tham số refetch (sẽ tự động set dryRun=true)'
  })
  @ApiResponse({
    status: 200,
    description: 'Dry run thành công',
    type: RefetchSummaryDto
  })
  async dryRunRefetchMissingOpens(@Body() dto: RefetchMissingOpensDto): Promise<BaseResponseDto<RefetchSummaryDto>> {
    // Force dry run mode
    const dryRunDto = { ...dto, dryRun: true };
    
    try {
      this.logger.log(`Starting dry-run refetch missing opens process`);

      const result = await this.refetchService.refetchMissingOpens(dryRunDto);

      this.logger.log(`Dry-run process completed:`, {
        totalScanned: result.totalScanned,
        totalRefetch: result.totalRefetch,
        totalFixed: result.totalFixed,
        totalSkipped: result.totalSkipped,
        totalErrors: result.totalErrors
      });

      return BaseResponseDto.success(
        result,
        `Dry-run completed. Would fix ${result.totalFixed} documents out of ${result.totalScanned} scanned.`
      );

    } catch (error) {
      this.logger.error('Failed to dry-run refetch missing opens:', error);
      
      return BaseResponseDto.error(
        'Failed to dry-run refetch missing opens',
        {
          error: error.message,
          details: error.stack
        } as any
      );
    }
  }
}
