import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Register new user (Public)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * Get all users (Admin only - currently no role check)
   */
  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  /**
   * Get current user profile (Protected)
   */
  @Get('profile')
  @UseGuards(JwtGuard)
  getProfile(@Request() req: any) {
    return this.userService.findOne(req.user.userId);
  }

  /**
   * Get user by ID (Admin only)
   */
  @Get(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  /**
   * Update current user profile (Protected)
   */
  @Patch('profile')
  @UseGuards(JwtGuard)
  updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    // Prevent customers from escalating privileges via profile update
    const { role, status, ...safe } = updateUserDto as any;
    return this.userService.update(req.user.userId, safe);
  }

  /**
   * Update user by ID (Admin only)
   */
  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  /**
   * Delete user by ID (Admin only)
   */
  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
