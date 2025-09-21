import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PerformanceMetricsDocument = PerformanceMetrics & Document;

@Schema({ timestamps: true })
export class PerformanceMetrics {
  @Prop({ required: true, unique: true })
  date: Date;

  @Prop({ default: 0 })
  totalSignals: number;

  @Prop({ default: 0 })
  buySignals: number;

  @Prop({ default: 0 })
  sellSignals: number;

  @Prop({ default: 0 })
  riskWarnings: number;

  @Prop({ default: 0 })
  tradesOpened: number;

  @Prop({ default: 0 })
  tradesClosed: number;

  @Prop({ default: 0 })
  totalPnl: number;

  @Prop()
  winRate?: number;

  @Prop()
  avgTradeDuration?: number;

  @Prop()
  maxDrawdown?: number;

  @Prop()
  portfolioValue?: number;

  @Prop()
  avgConfidence?: number;

  @Prop({ type: Object })
  additionalMetrics?: Record<string, any>;
}

export const PerformanceMetricsSchema = SchemaFactory.createForClass(PerformanceMetrics);

PerformanceMetricsSchema.index({ date: -1 });
