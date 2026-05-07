import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService) => ({
  global: true,
  secret: configService.get<string>('JWT_SECRET'),
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPIRES_IN') as string,
  },
});