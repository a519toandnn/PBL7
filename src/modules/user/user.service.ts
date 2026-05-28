import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password before saving
    const hashedPassword = await this.hashPassword(createUserDto.password);

    const user = this.userRepository.create({
      full_name: createUserDto.full_name,
      email: createUserDto.email,
      password_hash: hashedPassword,
      phone: createUserDto.phone ?? null,
    });

    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { created_at: 'ASC' },
    });
  }

  async findAllPaginated(page: number = 1, limit: number = 20) {
    const [data, total] = await this.userRepository.findAndCount({
      order: { created_at: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<User> {
    // Validate id
    if (!id || !Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['orders', 'cart', 'addresses'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmailUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingEmailUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    // Hash password if provided in update - check old password first
    if (updateUserDto.password) {
      if (!updateUserDto.old_password) {
        throw new BadRequestException(
          'Old password is required to change password',
        );
      }

      const isPasswordValid = await bcrypt.compare(
        updateUserDto.old_password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Old password is incorrect');
      }

      const hashedPassword = await this.hashPassword(updateUserDto.password);
      Object.assign(user, {
        password_hash: hashedPassword,
      });
    }

    Object.assign(user, {
      full_name: updateUserDto.full_name ?? user.full_name,
      email: updateUserDto.email ?? user.email,
      phone: updateUserDto.phone ?? user.phone,
      role: updateUserDto.role ?? user.role,
      status: updateUserDto.status ?? user.status,
    });

    return this.userRepository.save(user);
  }

  async updateProfile(
    id: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.update(id, {
      full_name: updateProfileDto.full_name,
      email: updateProfileDto.email,
      password: updateProfileDto.password,
      old_password: updateProfileDto.old_password,
      phone: updateProfileDto.phone,
    });
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
