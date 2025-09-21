import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Không 'debug' để tránh spam
  });
  
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('VITAS Trading System API')
    .setDescription(`
      Real-time trading signal system with AI-powered analysis.
      
      ## Features
      - Real-time market data fetching from FiinQuant
      - Technical analysis indicators (RSI, PSAR, Engulfing patterns)
      - Automated trading signal generation
      - Risk management and position sizing
      - Telegram and Email notifications
      - Portfolio tracking and performance metrics
      
      ## Trading Strategy
      The system uses RSI-PSAR-Engulfing strategy:
      - **RSI**: Relative Strength Index for momentum analysis
      - **PSAR**: Parabolic SAR for trend identification
      - **Engulfing**: Candlestick patterns for reversal signals
      - **Volume Analysis**: Volume anomaly detection
      
      ## Data Flow
      1. Fetch market data from FiinQuant API
      2. Calculate technical indicators
      3. Generate trading signals based on strategy rules
      4. Apply risk management filters
      5. Send notifications via Telegram/Email
    `)
    .setVersion('1.0.0')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
    },
    customSiteTitle: 'VITAS Trading API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #00d4aa; }
    `,
  });
  
  const port = process.env.PORT || 3333;
  await app.listen(port);
  
  // Chỉ hiển thị thông tin cần thiết
  console.log(`🚀 VITAS Trading System API is running on: http://localhost:${port}`);
}

bootstrap();
