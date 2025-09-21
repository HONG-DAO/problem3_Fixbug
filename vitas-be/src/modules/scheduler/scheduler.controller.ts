import { Controller, Get, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSchedulerService } from './data-scheduler.service';

@ApiTags('Scheduler')
@Controller('api/scheduler')
export class SchedulerController {
  private readonly logger = new Logger(SchedulerController.name);

  constructor(private readonly schedulerService: DataSchedulerService) {}

  /**
   * Get scheduler status
   */
  @Get('status')
  @ApiOperation({ summary: 'Get scheduler status' })
  @ApiResponse({ status: 200, description: 'Scheduler status retrieved successfully' })
  async getStatus() {
    try {
      const status = this.schedulerService.getStatus();
      return {
        success: true,
        data: status,
        message: 'Scheduler status retrieved successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get scheduler status:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Trigger manual data fetch
   */
  @Post('trigger-fetch')
  @ApiOperation({ summary: 'Trigger manual data fetch' })
  @ApiResponse({ status: 200, description: 'Manual fetch triggered successfully' })
  async triggerFetch() {
    try {
      const result = await this.schedulerService.triggerManualFetch();
      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      this.logger.error('Failed to trigger manual fetch:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Refresh tickers list
   */
  @Post('refresh-tickers')
  @ApiOperation({ summary: 'Refresh tickers list from FiinQuant' })
  @ApiResponse({ status: 200, description: 'Tickers list refreshed successfully' })
  async refreshTickers() {
    try {
      await this.schedulerService.refreshTickers();
      return {
        success: true,
        message: 'Tickers list refreshed successfully'
      };
    } catch (error) {
      this.logger.error('Failed to refresh tickers:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get next scheduled fetch time
   */
  @Get('next-fetch')
  @ApiOperation({ summary: 'Get next scheduled fetch time' })
  @ApiResponse({ status: 200, description: 'Next fetch time retrieved successfully' })
  async getNextFetch() {
    try {
      const nextFetchTime = this.schedulerService.getNextScheduledFetch();
      return {
        success: true,
        data: {
          nextFetchTime: nextFetchTime.toISOString(),
          nextFetchTimeLocal: nextFetchTime.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}),
          timeUntilNext: nextFetchTime.getTime() - Date.now()
        },
        message: 'Next fetch time retrieved successfully'
      };
    } catch (error) {
      this.logger.error('Failed to get next fetch time:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}
