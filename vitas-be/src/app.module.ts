import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration
import databaseConfig from './common/config/database.config';
import tradingConfig from './common/config/trading.config';
import notificationsConfig from './common/config/notifications.config';

// Feature Modules
import { TradingModule } from './modules/trading/trading.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MarketAnalysisModule } from './modules/market-analysis/market-analysis.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/notifications/notifications.module';


@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, tradingConfig, notificationsConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME,
      }),
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Feature modules
    TradingModule,
    MarketDataModule,
    AlertsModule,
    SchedulerModule,
    MarketAnalysisModule,
    DashboardModule,
    NotificationsModule,
  ],
})
export class AppModule {}