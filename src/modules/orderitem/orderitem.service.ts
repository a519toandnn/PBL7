import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './entities/orderitem.entity';
import { Order } from '../order/entities/order.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { CreateOrderitemDto } from './dto/create-orderitem.dto';
import { UpdateOrderitemDto } from './dto/update-orderitem.dto';

@Injectable()
export class OrderitemService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
  ) {}

  async create(createOrderitemDto: CreateOrderitemDto): Promise<OrderItem> {
    const order = await this.orderRepository.findOne({
      where: { id: createOrderitemDto.order_id },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    const product = await this.medicineRepository.findOne({
      where: { id: createOrderitemDto.product_id },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const orderItem = this.orderItemRepository.create({
      quantity: createOrderitemDto.quantity,
      unit_price: createOrderitemDto.unit_price,
      line_total: createOrderitemDto.line_total,
      product_name_snapshot: product.name,
      measure_unit_name_snapshot: null,
      order,
      product,
    });
    return this.orderItemRepository.save(orderItem);
  }

  async findAll(): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      relations: ['order', 'product'],
    });
  }

  async findOne(id: number): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'product'],
    });
    if (!orderItem) {
      throw new NotFoundException(`Order Item with ID ${id} not found`);
    }
    return orderItem;
  }

  async update(id: number, updateOrderitemDto: UpdateOrderitemDto): Promise<OrderItem> {
    const orderItem = await this.findOne(id);
    if (updateOrderitemDto.quantity !== undefined) {
      orderItem.quantity = updateOrderitemDto.quantity;
    }
    if (updateOrderitemDto.unit_price !== undefined) {
      orderItem.unit_price = updateOrderitemDto.unit_price;
    }
    if (updateOrderitemDto.line_total !== undefined) {
      orderItem.line_total = updateOrderitemDto.line_total;
    }
    return this.orderItemRepository.save(orderItem);
  }

  async remove(id: number): Promise<void> {
    const orderItem = await this.findOne(id);
    await this.orderItemRepository.remove(orderItem);
  }
}
