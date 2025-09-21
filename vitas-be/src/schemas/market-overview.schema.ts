import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketOverviewDocument = MarketOverview & Document;

@Schema({ timestamps: true })
export class MarketOverview {
  @Prop({ required: true })
  scenarioId: number;

  @Prop({ required: true })
  scenarioName: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ type: Object, required: true })
  metrics: {
    totalTickers: number;
    buySignals: number;
    sellSignals: number;
    riskWarnings: number;
    buySignalRatio: number;
    sellSignalRatio: number;
    riskWarningRatio: number;
    rsiBelow50Ratio: number;
    rsiAbove50Ratio: number;
    psarUpRatio: number;
    psarDownRatio: number;
    volumeIncreasePercent: number;
    bullishEngulfingRatio: number;
    bearishEngulfingRatio: number;
    totalSignalRatio: number;
    volumeAnomalyRatio: number;
    engulfingPatternRatio: number;
    rsiExtremeRatio: number;
    rsiRecovery: boolean;
    psarReversalRatio: number;
    volumePositiveGrowth: boolean;
    averageRSI: number;
    averageVolume: number;
    previousAverageVolume: number;
  };

  @Prop({ type: Object, required: true })
  tickers: {
    buy: string[];
    sell: string[];
    risk: string[];
    highVolume: string[];
    rsiExtreme: string[];
  };

  @Prop({ required: true, enum: ['info', 'warning', 'critical'] })
  alertLevel: string;

  @Prop({ default: false })
  isProcessed: boolean;

  @Prop()
  processedAt?: Date;
}

export const MarketOverviewSchema = SchemaFactory.createForClass(MarketOverview);

