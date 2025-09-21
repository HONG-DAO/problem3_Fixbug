import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemLogDocument = SystemLog & Document;

@Schema({ timestamps: true })
export class SystemLog {
  @Prop({ required: true })
  timestamp: Date;

  @Prop({ required: true, enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] })
  level: string;

  @Prop({ required: true })
  component: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  details?: Record<string, any>;

  @Prop()
  sessionId?: string;

  @Prop()
  userId?: string;

  @Prop({ type: Object })
  context?: Record<string, any>;
}

export const SystemLogSchema = SchemaFactory.createForClass(SystemLog);

// Create indexes for efficient querying
SystemLogSchema.index({ timestamp: -1 });
SystemLogSchema.index({ level: 1, timestamp: -1 });
SystemLogSchema.index({ component: 1, timestamp: -1 });

// TTL index to automatically delete old logs (30 days)
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
