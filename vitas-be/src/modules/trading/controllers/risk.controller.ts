import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CalculatePositionSizeDto } from '../dto/trading.dto';
import { BaseResponseDto } from '../../../common/dto/base.dto';
import { RiskService } from '../services/risk.service';

@ApiTags('Trading Risk Management')
@Controller('api/trading/risk')
export class RiskController {
  private readonly logger = new Logger(RiskController.name);

  constructor(private readonly riskService: RiskService) {}

  @Post('position-size')
  @ApiOperation({
    summary: 'Calculate optimal position size',
    description: 'Calculate the optimal position size based on risk management rules'
  })
  @ApiBody({ type: CalculatePositionSizeDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Position size calculated successfully',
    type: BaseResponseDto
  })
  async calculatePositionSize(@Body() dto: CalculatePositionSizeDto) {
    try {
      const { ticker, entryPrice, stopLossPrice, portfolioValue } = dto;
      
      const positionSize = await this.riskService.calculateOptimalPositionSize(
        ticker, entryPrice, stopLossPrice, portfolioValue
      );
      
      return BaseResponseDto.success({
        ticker,
        entryPrice,
        stopLossPrice,
        portfolioValue,
        recommendedShares: positionSize.shares,
        recommendedValue: positionSize.value,
        riskPercent: positionSize.riskPercent,
        maxLoss: positionSize.maxLoss
      }, 'Position size calculated successfully');
    } catch (error) {
      this.logger.error('Failed to calculate position size:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Get current risk metrics',
    description: 'Get current portfolio risk metrics and exposure'
  })
  @ApiQuery({ 
    name: 'portfolioValue', 
    required: true, 
    description: 'Current portfolio value in VND',
    example: '1000000000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Risk metrics retrieved successfully',
    type: BaseResponseDto
  })
  async getRiskMetrics(@Query('portfolioValue') portfolioValue: string) {
    try {
      const value = parseFloat(portfolioValue);
      const metrics = await this.riskService.getCurrentRiskMetrics(value);
      
      return BaseResponseDto.success(metrics, 'Risk metrics retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get risk metrics:', error);
      return BaseResponseDto.error(error.message);
    }
  }

  @Get('warnings')
  @ApiOperation({
    summary: 'Get current risk warnings',
    description: 'Get active risk warnings and recommendations'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Risk warnings retrieved successfully',
    type: BaseResponseDto
  })
  async getRiskWarnings() {
    try {
      const warnings = await this.riskService.getCurrentWarnings();
      
      return BaseResponseDto.success(warnings, 'Risk warnings retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to get risk warnings:', error);
      return BaseResponseDto.error(error.message);
    }
  }
}
