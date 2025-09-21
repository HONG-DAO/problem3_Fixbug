import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

// Services
import { TelegramService } from './services/telegram.service';
import { EmailService } from './services/email.service';

// Controllers
import { AlertsController } from './controllers/alerts.controller';

// Config
import mailerConfig from '../../common/config/mailer.config';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      useFactory: () => mailerConfig(),
      inject: [],
    }),
  ],
  controllers: [AlertsController],
  providers: [
    TelegramService,
    EmailService,
  ],
  exports: [
    TelegramService,
    EmailService,
  ],
})
export class AlertsModule {}
