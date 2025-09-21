import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketScenarioDocument = MarketScenario & Document;

@Schema({ timestamps: true })
export class MarketScenario {
  @Prop({ required: true })
  scenarioId: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object, required: true })
  conditions: {
    buySignalRatio?: { min?: number; max?: number };
    sellSignalRatio?: { min?: number; max?: number };
    rsiBelow50Ratio?: { min?: number };
    rsiAbove50Ratio?: { min?: number };
    psarUpRatio?: { min?: number };
    psarDownRatio?: { min?: number };
    volumeIncreasePercent?: { min?: number; max?: number };
    bullishEngulfingRatio?: { min?: number };
    bearishEngulfingRatio?: { min?: number };
    totalSignalRatio?: { min?: number };
    volumeAnomalyRatio?: { min?: number };
    engulfingPatternRatio?: { min?: number; max?: number };
    rsiExtremeRatio?: { min?: number };
    riskWarningRatio?: { min?: number };
    rsiRecovery?: boolean;
    psarReversalRatio?: { min?: number };
    volumePositiveGrowth?: boolean;
  };

  @Prop({ required: true })
  evaluation: string;

  @Prop({ required: true })
  recommendation: string;

  @Prop()
  note?: string;

  @Prop({ required: true, enum: ['info', 'warning', 'critical'] })
  alertLevel: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const MarketScenarioSchema = SchemaFactory.createForClass(MarketScenario);

