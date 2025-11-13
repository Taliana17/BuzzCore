import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LocationHistory } from 'src/location-history/entities/location-history.entity';
import { Notification } from 'src/notification/entities/notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'email' })
  preferred_channel: 'email' | 'sms';

  @Column({ nullable: true })
  last_detected_city: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @OneToMany(() => LocationHistory, (history) => history.user)
  location_history: LocationHistory[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
