import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Registers a new user in the system. Email must be unique. Password will be hashed automatically.',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully.',
    type: User,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data or email already exists.',
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error.',
  })
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieves a list of all registered users in the system. Requires authentication.',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users retrieved successfully.',
    type: [User],
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Find a user by ID',
    description: 'Retrieves detailed information about a specific user by their UUID. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found successfully.',
    type: User,
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found.',
  })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Update a user',
    description: 'Updates user information. All fields are optional. Only provided fields will be updated. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully.',
    type: User,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Delete a user',
    description: 'Permanently deletes a user from the system. This action cannot be undone. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'User unique identifier (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully.',
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized. Valid JWT token required.',
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found.',
  })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}