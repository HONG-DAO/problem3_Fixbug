import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Models
import { TradingSignal, TradingSignalSchema } from '../../schemas/trading-signal.schema';
import { Trade, TradeSchema } from '../../schemas/trade.schema';

// Infrastructure Services
import { TradingSignalService } from '../../infrastructure/database/trading-signal.service';
import { MarketDataService } from '../../infrastructure/database/market-data.service';
import { FiinQuantDataService } from '../../infrastructure/external-services/fiinquant-data.service';
import { RiskManagementService } from '../../infrastructure/external-services/risk-management.service';

// Core Services
import { TechnicalIndicatorsService } from '../../common/indicators/technical-indicators.service';
import { RSIPSAREngulfingStrategy } from '../../common/strategies/rsi-psar-engulfing.strategy';

// Module Services
import { AnalysisService } from './services/analysis.service';
import { RiskService } from './services/risk.service';
import { StrategyService } from './services/strategy.service';

// Controllers
import { AnalysisController } from './controllers/analysis.controller';
import { RiskController } from './controllers/risk.controller';
import { StrategyController } from './controllers/strategy.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: TradingSignal.name, schema: TradingSignalSchema },
      { name: Trade.name, schema: TradeSchema },
    ]),
  ],
  controllers: [
    AnalysisController,
    RiskController,
    StrategyController,
  ],
  providers: [
    // Infrastructure services
    TradingSignalService,
    MarketDataService,
    FiinQuantDataService,
    RiskManagementService,
    
    // Core services
    TechnicalIndicatorsService,
    RSIPSAREngulfingStrategy,
    
    // Module services
    AnalysisService,
    RiskService,
    StrategyService,
  ],
  exports: [
    AnalysisService,
    RiskService,
    StrategyService,
    TradingSignalService,
    MarketDataService,
  ],
})
export class TradingModule {}