import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationLog } from '../../notification-log/entities/notification-log.entity';
import { Channel } from '../../channel/entities/channel.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.notifications, { nullable: false })
  user: User;

  @Column({ type: 'enum', enum: ['email','sms'] })
  type: 'email' | 'sms';

  @Column()
  destination: string;

  @Column({ nullable: true })
  subject: string;

  @Column('text')
  message: string;

  @Column({ type: 'timestamp', nullable: true })
  send_at: Date;

  @Column({ type: 'enum', enum: ['pendiente','enviada','fallida'], default: 'pendiente' })
  status: 'pendiente' | 'enviada' | 'fallida';

  @OneToMany(() => NotificationLog, log => log.notification)
  logs: NotificationLog[];

  @ManyToOne(() => Channel, { nullable: true })
  channel: Channel;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
