import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { randomUUID } from 'crypto';
import { Order, OrderStatus } from './entities/order.entity';
import { User } from '../user/entities/user.entity';
import { OrderItem } from '../orderitem/entities/orderitem.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly dataSource: DataSource,
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
    const uniqueProductIds = Array.from(
      new Set(createOrderDto.items.map((item) => item.product_id)),
    );

    const products = await this.medicineRepository.find({
      where: { id: In(uniqueProductIds) },
      relations: ['prices', 'prices.measure_unit'],
    });

    if (products.length !== uniqueProductIds.length) {
      const foundIds = new Set(products.map((product) => product.id));
      const missing = uniqueProductIds.filter((id) => !foundIds.has(id));
      throw new BadRequestException(`Product not found: ${missing.join(', ')}`);
    }

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    for (const item of createOrderDto.items) {
      const product = productMap.get(item.product_id) as Medicine;
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
        measure_unit_name_snapshot: priceRow.measure_unit.name,
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
      relations: [
        'user',
        'items',
        'items.product',
        'payments',
        'payments.payment_method',
      ],
      order: { id: 'ASC' },
    });
  }

  async findAllPaginated(page: number = 1, limit: number = 20) {
    const [data, total] = await this.orderRepository.findAndCount({
      select: {
        id: true,
        order_no: true,
        total_amount: true,
        status: true,
        note: true,
        created_at: true,
      },
      relations: { user: true },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.product',
        'payments',
        'payments.payment_method',
      ],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findOneForUser(orderId: number, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: [
        'user',
        'items',
        'items.product',
        'payments',
        'payments.payment_method',
      ],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
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
    cartItemIds: number[],
    note?: string,
  ): Promise<Order> {
    const uniqueCartItemIds = [...new Set(cartItemIds)];
    if (uniqueCartItemIds.length !== cartItemIds.length) {
      throw new BadRequestException('Duplicate cart item IDs are not allowed');
    }

    const orderId = await this.dataSource.transaction(async (manager) => {
      const cart = await manager.findOne(Cart, {
        where: { user: { id: userId } },
        relations: ['user', 'items', 'items.product', 'items.measure_unit'],
      });

      if (!cart?.user) {
        throw new BadRequestException('User not found');
      }

      if (!cart.items || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      const selectedItems = cart.items.filter((item) =>
        uniqueCartItemIds.includes(item.id),
      );

      if (selectedItems.length !== uniqueCartItemIds.length) {
        throw new BadRequestException('One or more cart items are invalid');
      }

      let total = 0;
      const orderItems: OrderItem[] = [];

      const order = await manager.save(
        Order,
        manager.create(Order, {
          user: cart.user,
          order_no: this.generateOrderNo(),
          total_amount: 0,
          note: note ?? null,
          status: OrderStatus.PENDING,
        }),
      );

      for (const cartItem of selectedItems) {
        const unitPrice = Number(cartItem.unit_price_snapshot ?? 0);
        const lineTotal = unitPrice * cartItem.quantity;
        total += lineTotal;

        orderItems.push(
          manager.create(OrderItem, {
            order,
            product: cartItem.product,
            product_name_snapshot: cartItem.product.name,
            measure_unit_name_snapshot: cartItem.measure_unit?.name ?? null,
            quantity: cartItem.quantity,
            unit_price: unitPrice,
            line_total: lineTotal,
            cart_item_id: cartItem.id,
          }),
        );
      }

      await manager.save(OrderItem, orderItems);
      order.total_amount = total;
      await manager.save(Order, order);

      return order.id;
    });

    return this.findOne(orderId);
  }

  /**
   * Get all orders for a user
   */
  async getOrdersByUserId(userId: number): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.product',
        'payments',
        'payments.payment_method',
      ],
      order: { id: 'ASC' },
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
    return this.mapOrderDetails(order);
  }

  async getOrderDetailsForUser(orderId: number, userId: number) {
    const order = await this.findOneForUser(orderId, userId);
    return this.mapOrderDetails(order);
  }

  private mapOrderDetails(order: Order) {
    const items = order.items.map((item) => ({
      order_item_id: item.id,
      cart_item_id: item.cart_item_id,
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
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = randomUUID().slice(0, 8).toUpperCase();
    return `ORD-${date}-${random}`;
  }
}
