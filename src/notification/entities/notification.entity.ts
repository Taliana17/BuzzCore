import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import type { NotificationMetadata } from '../types/notification.types'; 
import { ApiProperty } from '@nestjs/swagger';

@Entity('notifications')
export class Notification {
  @ApiProperty({ description: 'Unique identifier for the notification' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User who receives the notification' })
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({ description: 'Notification message content' })
  @Column('text')
  message: string;

  @ApiProperty({ description: 'Recommended place for the user' })
  @Column()
  recommended_place: string;

  @ApiProperty({ 
    description: 'Delivery channel',
    enum: ['email', 'sms'],
    default: 'email'
  })
  @Column({ default: 'email' })
  channel: 'email' | 'sms';

  @ApiProperty({ description: 'When the notification was sent' })
  @CreateDateColumn()
  sent_at: Date;

  @ApiProperty({ 
    description: 'Delivery status',
    enum: ['sent', 'failed', 'pending'],
    default: 'pending'
  })
  @Column({ default: 'pending' })
  status: 'sent' | 'failed' | 'pending';

  @ApiProperty({ 
    description: 'Additional notification metadata',
    required: false 
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: NotificationMetadata;
}