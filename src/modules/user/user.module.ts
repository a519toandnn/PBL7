import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserAddressService } from './user-address.service';
import { UserAddressController } from './user-address.controller';
import { User } from './entities/user.entity';
import { UserAddress } from './entities/user-address.entity';
import { BootstrapAdminService } from './bootstrap-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserAddress])],
  controllers: [UserController, UserAddressController],
  providers: [UserService, UserAddressService, BootstrapAdminService],
  exports: [UserService, UserAddressService],
})
export class UserModule {}
