import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';
import type { NotificationMetadata } from '../types/notification.types';

@Entity('notifications')
export class Notification {
  @ApiProperty({
    description: 'Unique notification identifier (UUID v4). Automatically generated on notification creation.',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    format: 'uuid',
    readOnly: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User who receives this notification. Cascade delete: notification is deleted if user is deleted.',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    description: 'Notification message content sent to the user. Contains information about weather or recommended activities.',
    example: 'The weather in Bogotá is sunny today! Perfect for outdoor activities.',
    type: String,
  })
  @Column('text')
  message: string;

  @ApiProperty({
    description: 'Recommended place or activity based on current weather conditions in the user\'s location.',
    example: 'Visit Monserrate for a great view',
    type: String,
  })
  @Column()
  recommended_place: string;

  @ApiProperty({
    description: 'Channel used to send the notification. Defaults to email if not specified.',
    example: 'email',
    enum: ['email', 'sms'],
    default: 'email',
  })
  @Column({ default: 'email' })
  channel: 'email' | 'sms';

  @ApiProperty({
    description: 'Timestamp when the notification was sent. Automatically set on creation.',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
    readOnly: true,
  })
  @CreateDateColumn()
  sent_at: Date;

  @ApiProperty({
    description: 'Current status of the notification delivery. Tracks whether the notification was successfully sent, failed, or is pending.',
    example: 'sent',
    enum: ['sent', 'failed', 'pending'],
    default: 'pending',
  })
  @Column({ default: 'pending' })
  status: 'sent' | 'failed' | 'pending';

  @ApiProperty({
    description: 'Additional metadata about the notification (weather data, API responses, error details, etc.). Stored as JSON.',
    example: {
      weather: { temperature: 22, condition: 'sunny' },
      city: 'Bogotá',
      provider: 'OpenWeatherMap'
    },
    required: false,
    nullable: true,
    type: 'object',
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: NotificationMetadata;
}