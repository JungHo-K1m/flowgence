import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  
  if (isProduction) {
    // Production: Supabase PostgreSQL
    return {
      type: 'postgres',
      url: configService.get('DATABASE_URL'), // Supabase connection string
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Never use synchronize in production
      logging: false,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  } else {
    // Development: Local PostgreSQL
    return {
      type: 'postgres',
      host: configService.get('DB_HOST', 'localhost'),
      port: configService.get('DB_PORT', 5432),
      username: configService.get('DB_USERNAME', 'postgres'),
      password: configService.get('DB_PASSWORD', 'password'),
      database: configService.get('DB_NAME', 'flowgence'),
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true, // Only for development
      logging: configService.get('NODE_ENV') === 'development',
    };
  }
};
