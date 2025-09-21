import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dto/base.dto';
import { StrategyService } from '../services/strategy.service';

@ApiTags('Trading Strategy')
@Controller('api/trading/strategy')
export class StrategyController {
  private readonly logger = new Logger(StrategyController.name);

  constructor(private readonly strategyService: StrategyService) {}

  @Get('state/:ticker')
  @ApiOperation({
    summary: 'Get ticker strategy state',
    description: 'Get current strategy state for a specific ticker'
  })
  @ApiParam({ name: 'ticker', description: 'Stock symbol', example: 'VCB' })
  @ApiResponse({ 
    status: 200, 
    description: 'Strategy state retrieved successfully',
    type: BaseResponseDto
  })
  async getTickerState(@Param('ticker') ticker: string) {
    try {
      const state = await this.strategyService.getTickerState(ticker);
      
      return BaseResponseDto.success(state, `Strategy state for ${ticker}`);
    } catch (error) {
      this.logger.error(`Failed to get strategy state for ${ticker}:`, error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('performance')
  @ApiOperation({
    summary: 'Get strategy performance',
    description: 'Get overall strategy performance metrics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Performance metrics retrieved successfully',
    type: BaseResponseDto
  })
  async getPerformance() {
    try {
      const performance = await this.strategyService.getPerformanceMetrics();
      
      return BaseResponseDto.success(performance, 'Performance metrics retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get strategy performance:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get strategy status',
    description: 'Get current strategy operational status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Strategy status retrieved successfully',
    type: BaseResponseDto
  })
  async getStrategyStatus() {
    try {
      const status = await this.strategyService.getStrategyStatus();
      
      return BaseResponseDto.success(status, 'Strategy status retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get strategy status:', error);
      return BaseResponseDto.error(error.message);
    }
  }
}
