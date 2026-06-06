import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart } from './entities/cart.entity';
import { User } from '../user/entities/user.entity';
import { CartItem } from '../cartitem/entities/cartitem.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { MeasureUnit } from '../medicine/entities/measure-unit.entity';
import { MedicineModule } from '../medicine/medicine.module';

@Module({
  imports: [
    MedicineModule,
    TypeOrmModule.forFeature([Cart, User, CartItem, Medicine, MeasureUnit]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
