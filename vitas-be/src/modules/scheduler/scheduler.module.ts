import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DataSchedulerService } from './data-scheduler.service';
import { SchedulerController } from './scheduler.controller';

// Import required modules
import { MarketDataModule } from '../market-data/market-data.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MarketDataModule,
    NotificationsModule,
  ],
  controllers: [SchedulerController],
  providers: [DataSchedulerService],
  exports: [DataSchedulerService],
})
export class SchedulerModule {}
