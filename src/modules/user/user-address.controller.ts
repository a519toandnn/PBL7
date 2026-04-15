import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { UserAddressService } from './user-address.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { UserAddress } from './entities/user-address.entity';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('user/addresses')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  /**
   * Create a new address for current user
   */
  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @Body() createUserAddressDto: CreateUserAddressDto,
  ): Promise<UserAddress> {
    return this.userAddressService.create(req.user.userId, createUserAddressDto);
  }

  @Get('list')
  @UseGuards(JwtGuard)
  async findAll(@Request() req: any): Promise<UserAddress[]> {
    return this.userAddressService.findByUserId(req.user.userId);
  }

  /**
   * Update an address for current user
   */
  @Patch(':addressId')
  @UseGuards(JwtGuard)
  async update(
    @Request() req: any,
    @Param('addressId') addressId: string,
    @Body() updateUserAddressDto: UpdateUserAddressDto,
  ): Promise<UserAddress> {
    // Validate addressId is provided and numeric
    if (!addressId || !/^\d+$/.test(addressId)) {
      throw new BadRequestException('Address ID must be a valid number');
    }
    return this.userAddressService.update(
      Number(addressId),
      req.user.userId,
      updateUserAddressDto,
    );
  }

  /**
   * Delete an address for current user
   */
  @Delete(':addressId')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Request() req: any,
    @Param('addressId') addressId: string,
  ): Promise<void> {
    // Validate addressId is provided and numeric
    if (!addressId || !/^\d+$/.test(addressId)) {
      throw new BadRequestException('Address ID must be a valid number');
    }
    return this.userAddressService.remove(Number(addressId), req.user.userId);
  }

  /**
   * Get a single address for current user
   * Must be last to avoid matching /user/addresses before GET()
   */
  @Get(':addressId')
  @UseGuards(JwtGuard)
  async findOne(
    @Request() req: any,
    @Param('addressId') addressId: string,
  ): Promise<UserAddress> {
    // Validate addressId is provided and numeric
    if (!addressId || !/^\d+$/.test(addressId)) {
      throw new BadRequestException('Address ID must be a valid number');
    }
    return this.userAddressService.findOne(Number(addressId), req.user.userId);
  }
}

