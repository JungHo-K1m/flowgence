import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('requirements')
export class Requirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ 
    type: 'enum', 
    enum: ['functional', 'non_functional', 'technical', 'business', 'ui_ux', 'security', 'performance', 'integration'] 
  })
  category: string;

  @Column({ 
    type: 'enum', 
    enum: ['critical', 'high', 'medium', 'low'] 
  })
  priority: string;

  @Column({ 
    type: 'enum', 
    enum: ['draft', 'review', 'approved', 'rejected', 'implemented'],
    default: 'draft' 
  })
  status: string;

  @Column('text', { array: true, nullable: true })
  acceptanceCriteria: string[];

  @Column('uuid', { array: true, nullable: true })
  dependencies: string[];

  @Column({ nullable: true })
  estimatedHours: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Project, project => project.requirementsList)
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
