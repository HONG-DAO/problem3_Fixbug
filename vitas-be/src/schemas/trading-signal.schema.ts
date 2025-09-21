import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TradingSignalDocument = TradingSignal & Document;

@Schema({ timestamps: true })
export class TradingSignal {
  @Prop({ required: true })
  ticker: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true, enum: ['buy', 'sell', 'risk_warning'] })
  signalType: string;

  @Prop({ required: true, min: 0, max: 1 })
  confidence: number;

  @Prop({ required: true })
  entryPrice: number;

  @Prop()
  stopLoss?: number;

  @Prop()
  takeProfit?: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ default: '15m' })
  timeframe: string;

  @Prop({ type: Object })
  indicators?: {
    rsi?: number;
    psar?: number;
    psarTrend?: string;
    engulfingPattern?: number;
    volumeAnomaly?: boolean;
    priceVsPsar?: boolean;
  };
}

export const TradingSignalSchema = SchemaFactory.createForClass(TradingSignal);
