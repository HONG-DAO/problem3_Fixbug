import { registerAs } from '@nestjs/config';
import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';
import * as Handlebars from 'handlebars';

// Register Handlebars helpers
Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
Handlebars.registerHelper('lte', (a: number, b: number) => a <= b);
Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
Handlebars.registerHelper('and', (...args: any[]) => args.slice(0, -1).every(Boolean));
Handlebars.registerHelper('or', (...args: any[]) => args.slice(0, -1).some(Boolean));
Handlebars.registerHelper('not', (value: any) => !value);
Handlebars.registerHelper('formatNumber', (num: number) => num ? num.toLocaleString() : '0');
Handlebars.registerHelper('formatCurrency', (num: number) => num ? num.toLocaleString('vi-VN') + ' VND' : '0 VND');
Handlebars.registerHelper('formatPercent', (num: number) => num ? (num * 100).toFixed(2) + '%' : '0%');

export default registerAs('mailer', (): MailerOptions => ({
  transport: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  },
  defaults: {
    from: `"${process.env.EMAIL_FROM_NAME || 'VITAS Trading System'}" <${process.env.EMAIL_FROM}>`,
  },
  template: {
    dir: path.join(process.cwd(), 'src', 'templates', 'email'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
  preview: process.env.NODE_ENV === 'development', // Enable email preview in development
}));
