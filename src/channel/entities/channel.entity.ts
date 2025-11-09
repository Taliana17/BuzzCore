import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // email, sms

  @Column()
  provider: string; // Resend, Twilio

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
