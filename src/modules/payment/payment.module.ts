import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Order } from '../order/entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cartitem/entities/cartitem.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentMethod, Order, Cart, CartItem])],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
