import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketData1MDocument = MarketData1M & Document;

@Schema({ 
  timestamps: true,
  collection: 'stock-ss1m' // Explicit collection name
})
export class MarketData1M {
  @Prop({ required: true, index: true })
  ticker: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true, default: '1m' })
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

export const MarketData1MSchema = SchemaFactory.createForClass(MarketData1M);

// Create compound indexes for efficient queries
MarketData1MSchema.index({ ticker: 1, timestamp: -1 });
MarketData1MSchema.index({ ticker: 1, timestamp: 1 }); // For ascending queries
MarketData1MSchema.index({ timestamp: -1 }); // For time-based queries
MarketData1MSchema.index({ ticker: 1, timestamp: -1, timeframe: 1 }, { unique: true }); // Prevent duplicates

// TTL index for 1m data - expire after 90 days to save storage
MarketData1MSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
