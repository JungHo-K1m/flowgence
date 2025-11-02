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
      console.log('CORS 체크 - Origin:', origin);
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        console.log('CORS 허용: origin 없음');
        return callback(null, true);
      }
      
      // Allow Vercel deployments (모든 vercel.app 서브도메인 허용)
      if (origin.includes('vercel.app')) {
        console.log('CORS 허용: Vercel deployment');
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        console.log('CORS 허용: 허용 목록에 포함');
        return callback(null, true);
      }
      
      // For development, allow localhost with any port
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        console.log('CORS 허용: localhost (development)');
        return callback(null, true);
      }
      
      console.log('CORS 거부:', origin);
      console.log('허용된 Origins:', allowedOrigins);
      callback(new Error(`Not allowed by CORS: ${origin}`));
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
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log(`🎯 Server is ready for health checks`);
  
  // 추가 안정성 확인
  console.log(`🔍 Testing health endpoint...`);
  try {
    const testResponse = await fetch(`http://localhost:${port}/api/health`);
    if (testResponse.ok) {
      console.log(`✅ Health endpoint is working`);
    } else {
      console.log(`⚠️ Health endpoint returned: ${testResponse.status}`);
    }
  } catch (error) {
    console.log(`⚠️ Health endpoint test failed:`, error.message);
  }
}
bootstrap();
