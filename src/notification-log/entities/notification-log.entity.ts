import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Notification, n => n.logs, { onDelete: 'CASCADE' })
  notification: Notification;

  @Column()
  attempt: number;

  @Column({ type: 'enum', enum: ['exitoso','error'] })
  status: 'exitoso' | 'error';

  @Column('text', { nullable: true })
  response: string;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
