import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TradeDocument = Trade & Document;

@Schema({ timestamps: true })
export class Trade {
  @Prop({ required: true })
  ticker: string;

  @Prop({ required: true })
  entryDate: Date;

  @Prop()
  exitDate?: Date;

  @Prop({ required: true })
  entryPrice: number;

  @Prop()
  exitPrice?: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, enum: ['long', 'short'] })
  tradeType: string;

  @Prop({ required: true, enum: ['open', 'closed', 'cancelled'], default: 'open' })
  status: string;

  @Prop()
  pnlAmount?: number;

  @Prop()
  pnlPercent?: number;

  @Prop()
  maxPriceReached?: number;

  @Prop()
  minPriceReached?: number;

  @Prop()
  stopLossPrice?: number;

  @Prop()
  takeProfitPrice?: number;

  @Prop()
  exitReason?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const TradeSchema = SchemaFactory.createForClass(Trade);

// Create indexes
TradeSchema.index({ ticker: 1, status: 1 });
TradeSchema.index({ entryDate: -1 });
TradeSchema.index({ status: 1, entryDate: -1 });
