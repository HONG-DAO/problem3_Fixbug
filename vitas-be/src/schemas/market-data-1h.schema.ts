import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketData1HDocument = MarketData1H & Document;

@Schema({ 
  timestamps: true,
  collection: 'stock-ss1h' // Explicit collection name
})
export class MarketData1H {
  @Prop({ required: true, index: true })
  ticker: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true, default: '1h' })
  timeframe: string;

  @Prop({ required: true })
  open: number;

  @Prop({ required: true })
  high: number;

  @Prop({ required: true })
  low: number;

  @Prop({ required: true })
  close: number;

  @Prop({ required: true })
  volume: number;

  @Prop()
  change?: number;

  @Prop()
  changePercent?: number;

  @Prop()
  totalMatchValue?: number;

  @Prop()
  foreignBuyVolume?: number;

  @Prop()
  foreignSellVolume?: number;

  @Prop()
  matchVolume?: number;

  // Technical Indicators
  @Prop()
  rsi?: number;

  @Prop()
  psar?: number;

  @Prop()
  psarTrend?: string;

  @Prop()
  engulfingSignal?: number;

  @Prop()
  volumeAnomaly?: boolean;

  @Prop()
  priceVsPsar?: boolean;

  @Prop()
  avgVolume20?: number;
}

export const MarketData1HSchema = SchemaFactory.createForClass(MarketData1H);

// Create compound indexes for efficient queries
MarketData1HSchema.index({ ticker: 1, timestamp: -1 });
MarketData1HSchema.index({ ticker: 1, timestamp: 1 }); // For ascending queries
MarketData1HSchema.index({ timestamp: -1 }); // For time-based queries
MarketData1HSchema.index({ ticker: 1, timestamp: -1, timeframe: 1 }, { unique: true }); // Prevent duplicates
