import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { MarketAnalysisModule } from '../market-analysis/market-analysis.module';
import { TradingModule } from '../trading/trading.module';

@Module({
  imports: [
    AlertsModule,
    MarketAnalysisModule,
    TradingModule,
  ],
  controllers: [
    NotificationController,
  ],
  providers: [
    NotificationService,
  ],
  exports: [
    NotificationService,
  ],
})
export class NotificationsModule {}
