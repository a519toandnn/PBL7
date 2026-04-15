import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from './entities/user-address.entity';
import { User } from './entities/user.entity';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';

@Injectable()
export class UserAddressService {
  constructor(
    @InjectRepository(UserAddress)
    private readonly addressRepository: Repository<UserAddress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new address for a user
   */
  async create(userId: number, createUserAddressDto: CreateUserAddressDto): Promise<UserAddress> {
    const numericUserId = Number(userId);
    
    if (!numericUserId || !Number.isInteger(numericUserId) || numericUserId <= 0) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    const user = await this.userRepository.findOne({ where: { id: numericUserId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${numericUserId} not found`);
    }

    // If this is set as default, unset other default addresses
    if (createUserAddressDto.is_default) {
      await this.addressRepository.update(
        { user: { id: numericUserId }, is_default: true },
        { is_default: false },
      );
    }

    const address = this.addressRepository.create({
      user,
      receiver_name: createUserAddressDto.receiver_name,
      receiver_phone: createUserAddressDto.receiver_phone,
      address_line: createUserAddressDto.address_line,
      ward: createUserAddressDto.ward ?? null,
      province: createUserAddressDto.province ?? null,
      is_default: Boolean(createUserAddressDto.is_default),
    });

    return this.addressRepository.save(address);
  }

  /**
   * Get all addresses for a user
   */
  async findByUserId(userId: number): Promise<UserAddress[]> {
    // Convert to number if needed (JWT might pass as string)
    const numericUserId = Number(userId);

    if (!numericUserId || !Number.isInteger(numericUserId) || numericUserId <= 0) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    return this.addressRepository.find({
      where: { user: { id: numericUserId } },
      order: { id: 'ASC' },
    });
  }

  /**
   * Get a single address by ID
   */
  async findOne(addressId: number, userId: number): Promise<UserAddress> {
    const numericUserId = Number(userId);
    const numericAddressId = Number(addressId);

    if (!numericUserId || !Number.isInteger(numericUserId) || numericUserId <= 0) {
      throw new BadRequestException(`Invalid user ID: ${userId}`);
    }

    if (!numericAddressId || !Number.isInteger(numericAddressId) || numericAddressId <= 0) {
      throw new BadRequestException(`Invalid address ID: ${addressId}`);
    }

    const address = await this.addressRepository.findOne({
      where: { id: numericAddressId, user: { id: numericUserId } },
    });

    if (!address) {
      throw new NotFoundException(
        `Address with ID ${numericAddressId} not found for user ${numericUserId}`,
      );
    }

    return address;
  }

  /**
   * Update an address
   */
  async update(
    addressId: number,
    userId: number,
    updateUserAddressDto: UpdateUserAddressDto,
  ): Promise<UserAddress> {
    const address = await this.findOne(addressId, userId);

    // If setting as default, unset other default addresses
    if (updateUserAddressDto.is_default) {
      await this.addressRepository.update(
        { user: { id: userId }, is_default: true },
        { is_default: false },
      );
    }

    Object.assign(address, updateUserAddressDto);
    return this.addressRepository.save(address);
  }

  /**
   * Delete an address
   */
  async remove(addressId: number, userId: number): Promise<void> {
    const address = await this.findOne(addressId, userId);
    await this.addressRepository.remove(address);
  }
}
