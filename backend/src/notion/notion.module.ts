import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotionController } from './notion.controller';
import { NotionService } from './notion.service';
import { NotionConnection } from '../entities/notion-connection.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotionConnection]),
    SupabaseModule,
  ],
  controllers: [NotionController],
  providers: [NotionService, SupabaseAuthGuard],
  exports: [NotionService],
})
export class NotionModule {}

