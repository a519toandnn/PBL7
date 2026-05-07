import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entities/user.entity';

@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
    const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const fullName = process.env.BOOTSTRAP_ADMIN_FULL_NAME?.trim() || 'Admin';

    if (!email || !password) return;

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== UserRole.ADMIN || existing.status !== UserStatus.ACTIVE) {
        await this.userRepository.save({
          ...existing,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        });
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.userRepository.save(
      this.userRepository.create({
        email,
        full_name: fullName,
        password_hash: passwordHash,
        phone: null,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      }),
    );
  }
}

