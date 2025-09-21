import { Module } from '@nestjs/common';
import { DashboardController } from './controllers/dashboard.controller';
import { MarketAnalysisModule } from '../market-analysis/market-analysis.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { TradingModule } from '../trading/trading.module';

@Module({
  imports: [
    MarketAnalysisModule,
    MarketDataModule,
    TradingModule,
  ],
  controllers: [
    DashboardController,
  ],
})
export class DashboardModule {}

