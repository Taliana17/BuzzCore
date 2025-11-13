import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

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
}
