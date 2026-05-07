import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../user/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { IJwtPayload } from '../../common/interfaces';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    return this.issueToken(user);
  }

  async loginWithGoogle(idToken: string): Promise<{ access_token: string; user: any }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new BadRequestException('Google login is not configured (missing GOOGLE_CLIENT_ID)');
    }

    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(clientId);
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email) {
      throw new BadRequestException('Invalid Google token');
    }

    const fullName = payload?.name?.trim() || email.split('@')[0];

    let user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      const randomPassword = `google-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await this.userRepository.save(
        this.userRepository.create({
          email,
          full_name: fullName,
          password_hash: passwordHash,
          phone: null,
        }),
      );
    }

    return this.issueToken(user);
  }

  private issueToken(user: User): { access_token: string; user: any } {
    const payload: IJwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
        status: user.status,
      },
    };
  }

  validateToken(payload: IJwtPayload): IJwtPayload {
    return payload;
  }
}
