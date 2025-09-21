import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { TradingSignal, TradingSignalSchema } from '../../schemas/trading-signal.schema';

// Services
import { BacktestService } from './backtest.service';
import { BacktestController } from './backtest.controller';

// Dependencies
import { MarketDataService } from '../../infrastructure/database/market-data.service';
import { AnalysisService } from '../trading/services/analysis.service';
import { TradingSignalService } from '../../infrastructure/database/trading-signal.service';
import { TelegramService } from '../alerts/services/telegram.service';
import { EmailService } from '../alerts/services/email.service';
import { RSIPSAREngulfingStrategy } from '../../common/strategies/rsi-psar-engulfing.strategy';
import { TechnicalIndicatorsService } from '../../common/indicators/technical-indicators.service';
import { FiinQuantDataService } from '../../infrastructure/external-services/fiinquant-data.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: TradingSignal.name, schema: TradingSignalSchema, collection: 'trading-signal' },
    ]),
  ],
  controllers: [BacktestController],
  providers: [
    BacktestService,
    MarketDataService,
    AnalysisService,
    TradingSignalService,
    TelegramService,
    EmailService,
    RSIPSAREngulfingStrategy,
    TechnicalIndicatorsService,
    FiinQuantDataService,
  ],
  exports: [BacktestService],
})
export class BacktestModule {}
