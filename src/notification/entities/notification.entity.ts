import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import type { NotificationMetadata } from '../types/notification.types'; 

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  user: User;

  @Column('text')
  message: string;

  @Column()
  recommended_place: string;

  @Column({ default: 'email' })
  channel: 'email' | 'sms';

  @CreateDateColumn()
  sent_at: Date;

  @Column({ default: 'pending' })
  status: 'sent' | 'failed' | 'pending';

  @Column({ type: 'jsonb', nullable: true })
  metadata?: NotificationMetadata;
}