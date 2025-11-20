import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';

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
    description: 'User associated with this location record. Cascade delete: location history is deleted if user is deleted.',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.location_history, { onDelete: 'CASCADE' })
  user: User;

  @ApiProperty({
    description: 'City name where the user was detected. Determined via IP geolocation or GPS coordinates.',
    example: 'Bogotá',
    type: String,
  })
  @Column()
  city: string;

  @ApiProperty({
    description: 'Geographic coordinates (latitude and longitude) of the detected location. Stored as JSONB for flexibility.',
    example: { lat: 4.7110, lng: -74.0721 },
    required: false,
    nullable: true,
    type: 'object',
    properties: {
      lat: {
        type: 'number',
        description: 'Latitude coordinate',
        example: 4.7110,
        minimum: -90,
        maximum: 90
      },
      lng: {
        type: 'number',
        description: 'Longitude coordinate',
        example: -74.0721,
        minimum: -180,
        maximum: 180
      }
    }
  })
  @Column('jsonb', { nullable: true })
  coordinates: { lat: number; lng: number };

  @ApiProperty({
    description: 'Timestamp when the user arrived at or was detected in this location. Automatically set on record creation.',
    example: '2024-01-15T10:30:00.000Z',
    type: Date,
    readOnly: true,
  })
  @CreateDateColumn()
  arrival_date: Date;
}