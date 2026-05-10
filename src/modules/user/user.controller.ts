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
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UserRole } from './entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

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
  @UseGuards(JwtGuard, AdminGuard)
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
  @UseGuards(JwtGuard, AdminGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  /**
   * Update current user profile (Protected)
   */
  @Patch('profile')
  @UseGuards(JwtGuard)
  updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const profileUpdateDto: UpdateUserDto = {
      full_name: updateUserDto.full_name,
      email: updateUserDto.email,
      password: updateUserDto.password,
      old_password: updateUserDto.old_password,
      phone: updateUserDto.phone,
    };

    return this.userService.update(req.user.userId, profileUpdateDto);
  }

  /**
   * Update user by ID (Admin only)
   */
  @Patch(':id')
  @UseGuards(JwtGuard, AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * Delete user by ID (Admin only)
   */
  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
