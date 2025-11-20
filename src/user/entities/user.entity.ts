import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LocationHistory } from 'src/location-history/entities/location-history.entity';
import { Notification } from 'src/notification/entities/notification.entity';

@Entity('users')
export class User {
  @ApiProperty({
    description: 'Unique user identifier (UUID v4). Automatically generated on user creation.',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
    readOnly: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: "User's full name (first name and last name)",
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Unique email address. Used for authentication and email notifications.',
    example: 'john.doe@example.com',
    format: 'email',
    uniqueItems: true,
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: 'Mobile phone number for SMS notifications. International format recommended (E.164).',
    example: '+573001234567',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({
    description: "User's preferred channel for receiving notifications. Determines whether notifications are sent via email or SMS by default.",
    example: 'email',
    enum: ['email', 'sms'],
    default: 'email',
  })
  @Column({ default: 'email' })
  preferred_channel: 'email' | 'sms';

  @ApiProperty({
    description: 'Last city detected for the user based on IP geolocation. Updated automatically when user location changes.',
    example: 'Bogotá',
    required: false,
    nullable: true,
  })
  @Column({ nullable: true })
  last_detected_city: string;

  @ApiProperty({
    description: 'User password hashed using bcrypt (cost factor: 10). Never returned in API responses.',
    example: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    writeOnly: true,
    format: 'password',
  })
  @Column()
  password: string;

  @ApiProperty({
    description: "User's role in the system. Determines access permissions and available features. 'user' for regular users, 'admin' for administrators.",
    example: 'user',
    enum: ['user', 'admin'],
    default: 'user',
  })
  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @ApiProperty({
    description: "User's location history records. Contains all cities where the user has been detected over time, with timestamps.",
    type: () => LocationHistory,
    isArray: true,
  })
  @OneToMany(() => LocationHistory, (history) => history.user)
  location_history: LocationHistory[];

  @ApiProperty({
    description: 'All notifications sent to this user (both email and SMS). Includes status, content, and delivery information.',
    type: () => Notification,
    isArray: true,
  })
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}