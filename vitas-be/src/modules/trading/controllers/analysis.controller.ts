import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AnalyzeTickerDto, AnalyzeBulkDto } from '../dto/trading.dto';
import { BaseResponseDto } from '../../../common/dto/base.dto';
import { AnalysisService } from '../services/analysis.service';

@ApiTags('Trading Analysis')
@Controller('api/trading/analysis')
export class AnalysisController {
  private readonly logger = new Logger(AnalysisController.name);

  constructor(private readonly analysisService: AnalysisService) {}

  @Post('ticker')
  @ApiOperation({ 
    summary: 'Analyze single ticker',
    description: 'Fetch market data, calculate technical indicators, and generate trading signals for a single ticker'
  })
  @ApiBody({ type: AnalyzeTickerDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Analysis completed successfully',
    type: BaseResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid ticker or parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async analyzeTicker(@Body() dto: AnalyzeTickerDto) {
    try {
      const { ticker, periods } = dto;
      this.logger.log(`Analyzing ticker: ${ticker} with ${periods} periods`);
      
      const result = await this.analysisService.analyzeSingleTicker(ticker, periods);
      
      return BaseResponseDto.success(result, `Analysis completed for ${ticker}`);
    } catch (error) {
      this.logger.error(`Failed to analyze ticker ${dto.ticker}:`, error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Post('bulk')
  @ApiOperation({ 
    summary: 'Bulk analyze multiple tickers',
    description: 'Analyze multiple tickers in parallel batches for efficient processing'
  })
  @ApiBody({ type: AnalyzeBulkDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Bulk analysis completed',
    type: BaseResponseDto
  })
  async analyzeBulk(@Body() dto: AnalyzeBulkDto) {
    try {
      const { tickers, periods } = dto;
      this.logger.log(`Bulk analyzing ${tickers.length} tickers`);
      
      const results = await this.analysisService.analyzeBulkTickers(tickers, periods);
      
      const successCount = results.filter(r => (r as any).success).length;
      
      return BaseResponseDto.success(results, 
        `Bulk analysis completed: ${successCount}/${tickers.length} successful`, 
        { total: tickers.length, successful: successCount }
      );
    } catch (error) {
      this.logger.error('Failed to analyze bulk tickers:', error);
      return BaseResponseDto.error(error.message);
    }
  }
}
