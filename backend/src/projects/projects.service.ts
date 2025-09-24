import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Project } from '../entities/project.entity';
// import { Requirement } from '../entities/requirement.entity';
// import { Estimation } from '../entities/estimation.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    // @InjectRepository(Project)
    // private projectRepository: Repository<Project>,
    // @InjectRepository(Requirement)
    // private requirementRepository: Repository<Requirement>,
    // @InjectRepository(Estimation)
    // private estimationRepository: Repository<Estimation>,
  ) {}

  async create(createProjectDto: CreateProjectDto) {
    // const project = this.projectRepository.create(createProjectDto);
    // return this.projectRepository.save(project);
    return { message: 'Project created successfully (database disabled)', data: createProjectDto };
  }

  async findAll() {
    // return this.projectRepository.find({
    //   relations: ['requirements', 'estimations'],
    // });
    return { message: 'Database disabled - returning mock data', projects: [] };
  }

  async findOne(id: string) {
    // return this.projectRepository.findOne({
    //   where: { id },
    //   relations: ['requirements', 'estimations'],
    // });
    return { message: 'Database disabled - returning mock data', id };
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // await this.projectRepository.update(id, updateProjectDto);
    // return this.findOne(id);
    return { message: 'Project updated successfully (database disabled)', id, data: updateProjectDto };
  }

  async remove(id: string) {
    // await this.projectRepository.delete(id);
    return { message: 'Project deleted successfully (database disabled)', id };
  }

  async getRequirements(id: string) {
    // return this.requirementRepository.find({
    //   where: { projectId: id },
    //   order: { createdAt: 'ASC' },
    // });
    return { message: 'Database disabled - returning mock data', projectId: id, requirements: [] };
  }

  async getEstimations(id: string) {
    // return this.estimationRepository.find({
    //   where: { projectId: id },
    //   order: { createdAt: 'ASC' },
    // });
    return { message: 'Database disabled - returning mock data', projectId: id, estimations: [] };
  }
}
