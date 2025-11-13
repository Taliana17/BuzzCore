import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Entity('location_history')
export class LocationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.location_history, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  city: string;

  @Column('jsonb', { nullable: true })
  coordinates: { lat: number; lng: number };

  @CreateDateColumn()
  arrival_date: Date;
}
