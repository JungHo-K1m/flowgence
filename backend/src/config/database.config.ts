import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get('DATABASE_URL');
  const supabaseUrl = configService.get('SUPABASE_URL');
  const supabaseServiceKey = configService.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // DATABASE_URL이 제공된 경우 우선 사용
  if (databaseUrl) {
    console.log('🔗 Connecting to Supabase PostgreSQL using DATABASE_URL...');
    console.log('Database URL:', databaseUrl.substring(0, 50) + '...');
    
    return {
      type: 'postgres',
      url: databaseUrl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Supabase에서는 스키마를 수동으로 관리
      logging: configService.get('NODE_ENV') === 'development',
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        connectionTimeoutMillis: 15000, // 15초 타임아웃
        idleTimeoutMillis: 30000,
        max: 20,
      },
    };
  }
  
  // Supabase를 사용하는 경우 (fallback)
  if (supabaseUrl && supabaseServiceKey) {
    console.log('🔗 Connecting to Supabase PostgreSQL using service key...');
    console.log('Supabase URL:', supabaseUrl);
    
    // Supabase 연결 문자열 구성
    const dbUrl = supabaseUrl.replace('https://', '').replace('http://', '');
    const connectionString = `postgresql://postgres.${dbUrl}:${supabaseServiceKey}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;
    
    console.log('Connection string:', connectionString.substring(0, 50) + '...');
    
    return {
      type: 'postgres',
      url: connectionString,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false, // Supabase에서는 스키마를 수동으로 관리
      logging: configService.get('NODE_ENV') === 'development',
      ssl: {
        rejectUnauthorized: false,
      },
      extra: {
        connectionTimeoutMillis: 10000, // 10초 타임아웃
        idleTimeoutMillis: 30000,
        max: 20,
      },
    };
  }
  
  // 로컬 PostgreSQL 사용 (fallback)
  console.log('🔗 Connecting to local PostgreSQL...');
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
};
