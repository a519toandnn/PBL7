import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from '../user/entities/user.entity';
import { OrderItem } from '../orderitem/entities/orderitem.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { MeasureUnit } from '../medicine/entities/measure-unit.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(MeasureUnit)
    private readonly measureUnitRepository: Repository<MeasureUnit>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const user = await this.userRepository.findOne({
      where: { id: createOrderDto.user_id },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const order = this.orderRepository.create({
      order_no: this.generateOrderNo(),
      total_amount: 0,
      note: createOrderDto.note ?? null,
      status: createOrderDto.status ?? OrderStatus.PENDING,
      user,
    });
    const savedOrder = await this.orderRepository.save(order);

    let totalAmount = 0;
    const orderItems: OrderItem[] = [];

    for (const item of createOrderDto.items) {
      const product = await this.medicineRepository.findOne({
        where: { id: item.product_id },
        relations: ['prices', 'prices.measure_unit'],
      });
      if (!product) {
        throw new BadRequestException(`Product ${item.product_id} not found`);
      }

      const unit = await this.measureUnitRepository.findOne({
        where: { id: item.measure_unit_id },
      });
      if (!unit) {
        throw new BadRequestException(`Measure unit ${item.measure_unit_id} not found`);
      }

      const priceRow = product.prices.find(
        (price) => price.measure_unit.id === item.measure_unit_id,
      );
      if (!priceRow) {
        throw new BadRequestException(
          `No price for product ${item.product_id} and measure unit ${item.measure_unit_id}`,
        );
      }

      const lineTotal = Number(priceRow.price) * item.quantity;
      totalAmount += lineTotal;

      const orderItem = this.orderItemRepository.create({
        order: savedOrder,
        product,
        product_name_snapshot: product.name,
        measure_unit_name_snapshot: unit.name,
        quantity: item.quantity,
        unit_price: Number(priceRow.price),
        line_total: lineTotal,
      });

      orderItems.push(orderItem);
    }

    await this.orderItemRepository.save(orderItems);

    savedOrder.total_amount = totalAmount;
    await this.orderRepository.save(savedOrder);

    return this.findOne(savedOrder.id);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['user', 'items', 'items.product', 'payments', 'payments.payment_method'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product', 'payments', 'payments.payment_method'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    return this.orderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  // ===== E-Commerce Methods =====

  /**
   * Create order from user's cart
   * This method will be called during checkout
   */
  async createOrderFromCart(
    userId: number,
    note?: string,
  ): Promise<Order> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'items', 'items.product', 'items.measure_unit'],
    });

    if (!cart?.user) {
      throw new BadRequestException('User not found');
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let total = 0;
    const orderItems: OrderItem[] = [];

    const order = await this.orderRepository.save(
      this.orderRepository.create({
        user: cart.user,
        order_no: this.generateOrderNo(),
        total_amount: 0,
        note: note ?? null,
        status: OrderStatus.PENDING,
      }),
    );

    for (const cartItem of cart.items) {
      const unitPrice = Number(cartItem.unit_price_snapshot ?? 0);
      const lineTotal = unitPrice * cartItem.quantity;
      total += lineTotal;

      orderItems.push(
        this.orderItemRepository.create({
          order,
          product: cartItem.product,
          product_name_snapshot: cartItem.product.name,
          measure_unit_name_snapshot: cartItem.measure_unit?.name ?? null,
          quantity: cartItem.quantity,
          unit_price: unitPrice,
          line_total: lineTotal,
        }),
      );
    }

    await this.orderItemRepository.save(orderItems);
    order.total_amount = total;
    await this.orderRepository.save(order);

    return this.findOne(order.id);
  }

  /**
   * Get all orders for a user
   */
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'payments', 'payments.payment_method'],
      order: { created_at: 'DESC' },
    });

    if (orders.length === 0) {
      return [];
    }

    return orders;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.findOne(orderId);
    order.status = status;
    return this.orderRepository.save(order);
  }

  /**
   * Get order details
   */
  async getOrderDetails(orderId: number) {
    const order = await this.findOne(orderId);

    const items = order.items.map((item) => ({
      order_item_id: item.id,
      product_id: item.product?.id ?? null,
      product_name: item.product_name_snapshot,
      unit_name: item.measure_unit_name_snapshot,
      unit_price: item.unit_price,
      quantity: item.quantity,
      subtotal: item.line_total,
    }));

    return {
      order_id: order.id,
      order_no: order.order_no,
      user_id: order.user?.id ?? null,
      user_name: order.user?.full_name ?? null,
      status: order.status,
      note: order.note,
      total_amount: order.total_amount,
      created_at: order.created_at,
      items,
    };
  }

  private generateOrderNo(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 900 + 100);
    return `ORD-${timestamp}${random}`;
  }
}
