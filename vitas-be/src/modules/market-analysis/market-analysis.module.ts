import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketAnalysisService } from './services/market-analysis.service';
import { UserWatchlistService } from './services/user-watchlist.service';
import { MarketScenario, MarketScenarioSchema } from '../../schemas/market-scenario.schema';
import { MarketOverview, MarketOverviewSchema } from '../../schemas/market-overview.schema';
import { UserWatchlist, UserWatchlistSchema } from '../../schemas/user-watchlist.schema';
import { MarketDataModule } from '../market-data/market-data.module';
import { TradingModule } from '../trading/trading.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarketScenario.name, schema: MarketScenarioSchema },
      { name: MarketOverview.name, schema: MarketOverviewSchema },
      { name: UserWatchlist.name, schema: UserWatchlistSchema },
    ]),
    MarketDataModule,
    TradingModule,
  ],
  providers: [
    MarketAnalysisService,
    UserWatchlistService,
  ],
  exports: [
    MarketAnalysisService,
    UserWatchlistService,
  ],
})
export class MarketAnalysisModule {}

