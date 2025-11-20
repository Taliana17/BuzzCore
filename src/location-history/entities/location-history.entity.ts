import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

@Entity('location_history')
export class LocationHistory {
  @ApiProperty({
    description: 'Unique location history record identifier (UUID v4). Automatically generated on record creation.',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    format: 'uuid',
    readOnly: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User associated with this location record. Cascade delete ensures history is removed when the user is deleted.',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.location_history, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    description: 'City name where the user was detected. May be defined manually or inferred from coordinates.',
    example: 'Bogotá',
  })
  @Column()
  city: string;

  @ApiProperty({
    description: 'Geographic coordinates where the user was detected. Stored as JSONB.',
    example: { lat: 4.7110, lng: -74.0721 },
    nullable: true,
    required: false,
    type: Object,  // ✔ Swagger requiere esto, no 'object'
  })
  @Column('jsonb', { nullable: true })
  coordinates: { lat: number; lng: number };

  @ApiProperty({
    description: 'Timestamp when the user arrived at/detected in this location. Automatically set.',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
    readOnly: true,
  })
  @CreateDateColumn()
  arrival_date: Date;
}
