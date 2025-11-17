import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotionController } from './notion.controller';
import { NotionService } from './notion.service';
import { NotionConnection } from '../entities/notion-connection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotionConnection])],
  controllers: [NotionController],
  providers: [NotionService],
  exports: [NotionService],
})
export class NotionModule {}

