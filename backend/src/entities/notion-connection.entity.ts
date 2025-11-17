import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notion_connections')
export class NotionConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string;

  @Column({ name: 'workspace_id', type: 'text', nullable: true })
  workspaceId: string;

  @Column({ name: 'workspace_name', type: 'text', nullable: true })
  workspaceName: string;

  @Column({ name: 'bot_id', type: 'text', nullable: true })
  botId: string;

  @Column({ name: 'database_id', type: 'text', nullable: true })
  databaseId: string;

  @Column({ name: 'connected_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  connectedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

