import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS for frontend communication
  const corsOrigin = configService.get('CORS_ORIGIN');
  const allowedOrigins = corsOrigin ? corsOrigin.split(',') : ['http://localhost:3000'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // For development, allow localhost with any port
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }
      
      // Allow Vercel preview deployments
      if (origin.includes('vercel.app')) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  
  // Railway 환경에서 포트 확인
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔧 PORT from env: ${process.env.PORT}`);
  console.log(`🔧 Using port: ${port}`);
  
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Backend server is running on: http://0.0.0.0:${port}`);
  console.log(`📚 API Documentation: http://0.0.0.0:${port}/api`);
  console.log(`🔍 Health check: http://0.0.0.0:${port}/api/health`);
  console.log(`✅ Server started successfully on port ${port}`);
  
  // Railway 헬스체크를 위한 추가 대기 시간
  console.log(`⏳ Waiting for health check readiness...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log(`🎯 Server is ready for health checks`);
}
bootstrap();
