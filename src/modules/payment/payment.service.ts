import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cartitem/entities/cartitem.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: createPaymentDto.order_id },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const paymentMethod = await this.getOrCreatePaymentMethod(
      createPaymentDto.payment_method_code,
    );

    const payment = this.paymentRepository.create({
      order,
      payment_method: paymentMethod,
      amount: createPaymentDto.amount ?? Number(order.total_amount),
      status: createPaymentDto.status ?? PaymentStatus.PENDING,
      provider_txn_id: createPaymentDto.provider_txn_id ?? null,
      paid_at: null,
    });
    return this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['order', 'payment_method'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order', 'payment_method'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async update(id: number, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    if (updatePaymentDto.payment_method_code) {
      payment.payment_method = await this.getOrCreatePaymentMethod(
        updatePaymentDto.payment_method_code,
      );
    }

    payment.amount = updatePaymentDto.amount ?? payment.amount;
    payment.status = updatePaymentDto.status ?? payment.status;
    payment.provider_txn_id = updatePaymentDto.provider_txn_id ?? payment.provider_txn_id;

    return this.paymentRepository.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }

  // ===== E-Commerce Methods =====

  /**
   * Process payment for an order
   * This will:
   * 1. Create payment record with PENDING status
   * 2. Update order status to PAID
   * 3. Clear user's cart
   * 4. Update payment status to SUCCESS
   */
  async processPayment(
    orderId: number,
    paymentMethodCode: string,
  ): Promise<{
    payment: Payment;
    message: string;
  }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'user.cart', 'user.cart.items'],
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const paymentMethod = await this.getOrCreatePaymentMethod(paymentMethodCode);

    const payment = this.paymentRepository.create({
      order,
      payment_method: paymentMethod,
      amount: Number(order.total_amount),
      status: PaymentStatus.PENDING,
      provider_txn_id: null,
      paid_at: null,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    savedPayment.status = PaymentStatus.SUCCESS;
    savedPayment.paid_at = new Date();
    const processedPayment = await this.paymentRepository.save(savedPayment);

    order.status = OrderStatus.PAID;
    await this.orderRepository.save(order);

    if (order.user && order.user.cart) {
      const cartItems = await this.cartItemRepository.find({
        where: { cart: { id: order.user.cart.id } },
      });
      if (cartItems.length > 0) {
        await this.cartItemRepository.remove(cartItems);
      }
    }

    return {
      payment: processedPayment,
      message: 'Payment successful. Your order has been confirmed and cart has been cleared.',
    };
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: number) {
    const payment = await this.findOne(paymentId);

    return {
      payment_id: payment.id,
      order_id: payment.order.id,
      payment_method_code: payment.payment_method.code,
      payment_method_name: payment.payment_method.name,
      payment_status: payment.status,
      amount: payment.amount,
      provider_txn_id: payment.provider_txn_id,
      paid_at: payment.paid_at,
      created_at: payment.created_at,
    };
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: number): Promise<Payment[]> {
    const payments = await this.paymentRepository.find({
      where: { order: { id: orderId } },
      relations: ['order', 'payment_method'],
      order: { created_at: 'DESC' },
    });

    if (payments.length === 0) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payments;
  }

  private async getOrCreatePaymentMethod(code: string): Promise<PaymentMethod> {
    let paymentMethod = await this.paymentMethodRepository.findOne({ where: { code } });
    if (!paymentMethod) {
      paymentMethod = await this.paymentMethodRepository.save(
        this.paymentMethodRepository.create({
          code,
          name: code,
          is_active: true,
        }),
      );
    }

    return paymentMethod;
  }
}
