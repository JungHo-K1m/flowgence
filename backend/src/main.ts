import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AnthropicExceptionFilter } from './common/filters/anthropic-exception.filter';
import {
  CORS_TRUSTED_PATTERNS,
  CORS_DEFAULT_ORIGIN,
  DEFAULT_PORT,
  HEALTH_CHECK_DELAY_MS,
} from './common/constants';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── CORS ──────────────────────────────────────────────────────
  const corsOrigin = configService.get('CORS_ORIGIN');
  const allowedOrigins = corsOrigin
    ? corsOrigin.split(',')
    : [CORS_DEFAULT_ORIGIN];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow trusted domain patterns
      if (CORS_TRUSTED_PATTERNS.some(pattern => origin.includes(pattern))) {
        return callback(null, true);
      }

      // Check explicit allow-list
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Development: allow any localhost
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }

      logger.warn('CORS rejected: %s', origin);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // ── Global pipes & filters ────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AnthropicExceptionFilter());

  // ── Global prefix ─────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Start ─────────────────────────────────────────────────────
  const port = process.env.PORT || DEFAULT_PORT;

  logger.log('Environment: %s', process.env.NODE_ENV);
  logger.log('Using port: %s', port);

  await app.listen(port, '0.0.0.0');

  logger.log('Server is running on http://0.0.0.0:%s', port);
  logger.log('Health check: http://0.0.0.0:%s/api/health', port);

  // Railway health-check readiness delay
  await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_DELAY_MS));
  logger.log('Server is ready for health checks');
}
bootstrap();
