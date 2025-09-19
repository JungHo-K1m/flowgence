import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('estimations')
export class Estimation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column('decimal', { precision: 12, scale: 2 })
  totalCost: number;

  @Column()
  totalHours: number;

  @Column('jsonb')
  breakdown: any;

  @Column('text', { array: true, nullable: true })
  assumptions: string[];

  @Column('jsonb', { nullable: true })
  risks: any;

  @Column('jsonb', { nullable: true })
  timeline: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Project, project => project.estimations)
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
