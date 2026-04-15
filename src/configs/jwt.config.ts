import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService) => ({
  global: true,
  secret: configService.get<string>('JWT_SECRET'),
  signOptions: {
    expiresIn: configService.get<string>('JWT_EXPRIRES_IN') as string,
  },
});