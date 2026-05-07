import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Login and get JWT token
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Login/Register with Google ID token
   */
  @Post('google')
  @HttpCode(HttpStatus.OK)
  async google(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.idToken);
  }
}
