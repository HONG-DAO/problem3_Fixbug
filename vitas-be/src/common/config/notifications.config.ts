import { registerAs } from '@nestjs/config';

export default registerAs('notifications', () => ({
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    debounceMinutes: parseInt(process.env.TELEGRAM_DEBOUNCE_MINUTES || '5'),
    maxAlertsPerHour: parseInt(process.env.TELEGRAM_MAX_ALERTS_PER_HOUR || '20'),
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO?.split(',') || [],
    debounceMinutes: parseInt(process.env.EMAIL_DEBOUNCE_MINUTES || '15'),
    maxEmailsPerHour: parseInt(process.env.EMAIL_MAX_PER_HOUR || '10'),
    dailySummaryTime: process.env.EMAIL_DAILY_SUMMARY_TIME || '17:00',
  },
  alertTypes: {
    buySignal: process.env.ALERT_BUY_SIGNAL !== 'false',
    sellSignal: process.env.ALERT_SELL_SIGNAL !== 'false',
    riskWarning: process.env.ALERT_RISK_WARNING !== 'false',
    volumeAnomaly: process.env.ALERT_VOLUME_ANOMALY !== 'false',
    dailySummary: process.env.ALERT_DAILY_SUMMARY !== 'false',
    portfolioUpdate: process.env.ALERT_PORTFOLIO_UPDATE !== 'false',
  },
}));
