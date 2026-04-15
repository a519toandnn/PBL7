import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartitemService } from './cartitem.service';
import { CartitemController } from './cartitem.controller';
import { CartItem } from './entities/cartitem.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { MeasureUnit } from '../medicine/entities/measure-unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CartItem, Cart, Medicine, MeasureUnit])],
  controllers: [CartitemController],
  providers: [CartitemService],
  exports: [CartitemService],
})
export class CartitemModule {}
