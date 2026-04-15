import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderitemService } from './orderitem.service';
import { OrderitemController } from './orderitem.controller';
import { OrderItem } from './entities/orderitem.entity';
import { Order } from '../order/entities/order.entity';
import { Medicine } from '../medicine/entities/medicine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem, Order, Medicine])],
  controllers: [OrderitemController],
  providers: [OrderitemService],
  exports: [OrderitemService],
})
export class OrderitemModule {}
