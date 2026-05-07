import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path'; // Import 'join' từ 'path'

export const typeORMConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT') || 5432,
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    entities: [join(__dirname, '..', '**', '*.entity.{js,ts}')],
    migrations: ['dist/src/database/migrations/*.js'],
    migrationsRun: false,
    synchronize: true,
  };
};