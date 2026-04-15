import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Order } from './entities/order.entity';
import { User } from '../user/entities/user.entity';
import { OrderItem } from '../orderitem/entities/orderitem.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { MeasureUnit } from '../medicine/entities/measure-unit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, OrderItem, Cart, Medicine, MeasureUnit]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
