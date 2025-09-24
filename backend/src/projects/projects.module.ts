import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from '../entities/project.entity';
import { Requirement } from '../entities/requirement.entity';
import { Estimation } from '../entities/estimation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Requirement, Estimation])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
