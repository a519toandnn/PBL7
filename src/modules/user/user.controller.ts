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
  Query,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

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
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    return this.userService.findAllPaginated(page, Math.min(limit, 100));
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
  updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.userId, updateProfileDto);
  }

  /**
   * Update user by ID (Admin only)
   */
  @Patch(':id')
  @UseGuards(JwtGuard, AdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: AdminUpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  /**
   * Delete user by ID (Admin only)
   */
  @Delete(':id')
  @UseGuards(JwtGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
