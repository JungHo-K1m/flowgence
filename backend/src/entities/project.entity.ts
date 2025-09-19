import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ChatMessage } from './chat-message.entity';
import { File } from './file.entity';
import { Requirement } from './requirement.entity';
import { Estimation } from './estimation.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ 
    type: 'enum', 
    enum: ['draft', 'in_progress', 'requirements_review', 'estimation_review', 'contract_review', 'completed', 'cancelled'],
    default: 'draft' 
  })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  projectOverview: any;

  @Column({ type: 'jsonb', nullable: true })
  requirements: any;

  @Column({ type: 'jsonb', nullable: true })
  estimation: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.projects)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ChatMessage, message => message.project)
  messages: ChatMessage[];

  @OneToMany(() => File, file => file.project)
  files: File[];

  @OneToMany(() => Requirement, requirement => requirement.project)
  requirementsList: Requirement[];

  @OneToMany(() => Estimation, estimation => estimation.project)
  estimations: Estimation[];
}
