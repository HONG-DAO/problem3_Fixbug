import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserWatchlistDocument = UserWatchlist & Document;

@Schema({ timestamps: true })
export class UserWatchlist {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  ticker: string;

  @Prop({ 
    required: true, 
    type: [String],
    enum: ['telegram', 'email', 'dashboard']
  })
  notificationChannels: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop()
  lastNotificationAt?: Date;

  @Prop({ type: Object })
  preferences?: {
    minConfidence?: number;
    signalTypes?: string[];
    timeframes?: string[];
  };
}

export const UserWatchlistSchema = SchemaFactory.createForClass(UserWatchlist);
