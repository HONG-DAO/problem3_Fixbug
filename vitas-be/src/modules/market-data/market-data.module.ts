import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Multi-timeframe Models
import { MarketData1D, MarketData1DSchema } from '../../schemas/market-data-1d.schema';
import { MarketData4H, MarketData4HSchema } from '../../schemas/market-data-4h.schema';
import { MarketData1H, MarketData1HSchema } from '../../schemas/market-data-1h.schema';
import { MarketData15M, MarketData15MSchema } from '../../schemas/market-data-15m.schema';
import { MarketData1M, MarketData1MSchema } from '../../schemas/market-data-1m.schema';

// Infrastructure Services
import { MarketDataService } from '../../infrastructure/database/market-data.service';
import { FiinQuantDataService } from '../../infrastructure/external-services/fiinquant-data.service';

// Core Services
import { TechnicalIndicatorsService } from '../../common/indicators/technical-indicators.service';

// Module Services
import { DataFetchService } from './services/data-fetch.service';
import { DataQueryService } from './services/data-query.service';
import { RefetchMissingOpensService } from './services/refetch-missing-opens.service';

// Controllers
import { DataFetchController } from './controllers/data-fetch.controller';
import { DataQueryController } from './controllers/data-query.controller';
import { RefetchMissingOpensController } from './controllers/refetch-missing-opens.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: MarketData1D.name, schema: MarketData1DSchema, collection: 'stock-ss1d' },
      { name: MarketData4H.name, schema: MarketData4HSchema, collection: 'stock-ss4h' },
      { name: MarketData1H.name, schema: MarketData1HSchema, collection: 'stock-ss1h' },
      { name: MarketData15M.name, schema: MarketData15MSchema, collection: 'stock-ss15m' },
      { name: MarketData1M.name, schema: MarketData1MSchema, collection: 'stock-ss1m' },
    ]),
  ],
  controllers: [
    DataFetchController,
    DataQueryController,
    RefetchMissingOpensController,
  ],
  providers: [
    // Infrastructure services
    MarketDataService,
    FiinQuantDataService,
    
    // Core services
    TechnicalIndicatorsService,
    
    // Module services
    DataFetchService,
    DataQueryService,
    RefetchMissingOpensService,
  ],
  exports: [
    DataFetchService,
    DataQueryService,
    RefetchMissingOpensService,
    MarketDataService,
    FiinQuantDataService,
    TechnicalIndicatorsService,
  ],
})
export class MarketDataModule {}
