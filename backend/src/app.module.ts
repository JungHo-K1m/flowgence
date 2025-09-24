import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig } from './config/database.config';

// Entities
import { User } from './entities/user.entity';
import { Project } from './entities/project.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Requirement } from './entities/requirement.entity';
import { Estimation } from './entities/estimation.entity';
import { File } from './entities/file.entity';

// Modules
import { ChatModule } from './chat/chat.module';
import { ProjectsModule } from './projects/projects.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database module
    TypeOrmModule.forRootAsync({
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),

    // Feature modules
    TypeOrmModule.forFeature([
      User,
      Project,
      ChatMessage,
      Requirement,
      Estimation,
      File,
    ]),

    ChatModule,
    ProjectsModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
