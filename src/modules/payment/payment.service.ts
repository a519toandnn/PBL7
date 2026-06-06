import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import {
  buildVnpayPaymentUrl,
  formatVnpayDate,
  verifyVnpSecureHash,
} from './utils/vnpay.util';

@Injectable()
export class PaymentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
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

    const paymentMethod = await this.getActivePaymentMethod(
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
      order: { id: 'ASC' },
    });
  }

  async findAllPaginated(page: number = 1, limit: number = 20) {
    const [data, total] = await this.paymentRepository.findAndCount({
      relations: ['order', 'payment_method'],
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

  async findOneForUser(paymentId: number, userId: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, order: { user: { id: userId } } },
      relations: ['order', 'payment_method'],
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);

    if (updatePaymentDto.payment_method_code) {
      payment.payment_method = await this.getActivePaymentMethod(
        updatePaymentDto.payment_method_code,
      );
    }

    payment.amount = updatePaymentDto.amount ?? payment.amount;
    payment.status = updatePaymentDto.status ?? payment.status;
    payment.provider_txn_id =
      updatePaymentDto.provider_txn_id ?? payment.provider_txn_id;

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
   * 3. Update payment status to SUCCESS
   */
  async processPayment(
    orderId: number,
    paymentMethodCode: string,
  ): Promise<{
    payment: Payment;
    message: string;
  }> {
    return this.processPaymentInternal(orderId, paymentMethodCode);
  }

  async processPaymentForUser(
    orderId: number,
    userId: number,
    paymentMethodCode: string,
  ): Promise<{
    payment: Payment;
    message: string;
  }> {
    return this.processPaymentInternal(orderId, paymentMethodCode, userId);
  }

  async initiatePaymentForUser(
    orderId: number,
    userId: number,
    initiatePaymentDto: InitiatePaymentDto,
    ipAddress: string,
  ) {
    const methodCode = initiatePaymentDto.payment_method_code.toUpperCase();

    if (methodCode === 'COD') {
      return this.initiateCodPayment(orderId, userId);
    }

    if (methodCode === 'VNPAY') {
      if (!this.isVnpayGatewayEnabled()) {
        return this.completeDemoVnpayPayment(orderId, userId);
      }

      return this.initiateVnpayPayment(
        orderId,
        userId,
        initiatePaymentDto,
        ipAddress,
      );
    }

    throw new BadRequestException('Unsupported payment method');
  }

  private async initiateCodPayment(orderId: number, userId: number) {
    const payment = await this.dataSource.transaction(async (manager) => {
      const order = await this.findPendingOrderForPayment(
        manager,
        orderId,
        userId,
      );

      const existingSuccess = await manager.findOne(Payment, {
        where: { order: { id: order.id }, status: PaymentStatus.SUCCESS },
      });
      if (existingSuccess) {
        throw new BadRequestException('Order has already been paid');
      }

      const paymentMethod = await this.getActivePaymentMethod('COD', manager);
      const existingPendingCod = await manager.findOne(Payment, {
        where: {
          order: { id: order.id },
          payment_method: { id: paymentMethod.id },
          status: PaymentStatus.PENDING,
        },
        relations: ['order', 'payment_method'],
      });

      if (existingPendingCod) {
        return existingPendingCod;
      }

      return manager.save(
        Payment,
        manager.create(Payment, {
          order,
          payment_method: paymentMethod,
          amount: Number(order.total_amount),
          status: PaymentStatus.PENDING,
          provider_txn_id: null,
          paid_at: null,
        }),
      );
    });

    return {
      order_id: orderId,
      payment: this.mapPaymentSummary(payment),
      next_action: { type: 'NONE' },
      message:
        'Order created with COD payment. Payment will be confirmed after cash collection.',
    };
  }

  private async completeDemoVnpayPayment(orderId: number, userId: number) {
    const payment = await this.dataSource.transaction(async (manager) => {
      const order = await this.findPendingOrderForPayment(
        manager,
        orderId,
        userId,
      );

      const existingSuccess = await manager.findOne(Payment, {
        where: { order: { id: order.id }, status: PaymentStatus.SUCCESS },
      });
      if (existingSuccess) {
        throw new BadRequestException('Order has already been paid');
      }

      const paymentMethod = await this.getActivePaymentMethod(
        'VNPAY',
        manager,
      );

      await manager
        .createQueryBuilder()
        .update(Payment)
        .set({ status: PaymentStatus.FAILED })
        .where('"order_id" = :orderId', { orderId: order.id })
        .andWhere('"payment_method_id" = :paymentMethodId', {
          paymentMethodId: paymentMethod.id,
        })
        .andWhere('"status" = :status', { status: PaymentStatus.PENDING })
        .execute();

      order.status = OrderStatus.PAID;
      await manager.save(Order, order);

      return manager.save(
        Payment,
        manager.create(Payment, {
          order,
          payment_method: paymentMethod,
          amount: Number(order.total_amount),
          status: PaymentStatus.SUCCESS,
          provider_txn_id: `VNPAY-DEMO-${order.id}-${Date.now()}`,
          paid_at: new Date(),
        }),
      );
    });

    return {
      order_id: orderId,
      payment: this.mapPaymentSummary(payment),
      next_action: { type: 'NONE' },
      message: 'Demo VNPAY payment successful. Order has been marked as paid.',
    };
  }

  private async initiateVnpayPayment(
    orderId: number,
    userId: number,
    initiatePaymentDto: InitiatePaymentDto,
    ipAddress: string,
  ) {
    const vnpayConfig = this.getVnpayConfig(initiatePaymentDto.return_url);
    const now = new Date();
    const expireDate = new Date(now.getTime() + 15 * 60 * 1000);

    const payment = await this.dataSource.transaction(async (manager) => {
      const order = await this.findPendingOrderForPayment(
        manager,
        orderId,
        userId,
      );

      const existingSuccess = await manager.findOne(Payment, {
        where: { order: { id: order.id }, status: PaymentStatus.SUCCESS },
      });
      if (existingSuccess) {
        throw new BadRequestException('Order has already been paid');
      }

      if (Number(order.total_amount) <= 0) {
        throw new BadRequestException('Order amount must be greater than 0');
      }

      const paymentMethod = await this.getActivePaymentMethod(
        'VNPAY',
        manager,
      );

      await manager
        .createQueryBuilder()
        .update(Payment)
        .set({ status: PaymentStatus.FAILED })
        .where('"order_id" = :orderId', { orderId: order.id })
        .andWhere('"payment_method_id" = :paymentMethodId', {
          paymentMethodId: paymentMethod.id,
        })
        .andWhere('"status" = :status', { status: PaymentStatus.PENDING })
        .execute();

      const txnRef = this.generateVnpayTxnRef(order.id);
      return manager.save(
        Payment,
        manager.create(Payment, {
          order,
          payment_method: paymentMethod,
          amount: Number(order.total_amount),
          status: PaymentStatus.PENDING,
          provider_txn_id: txnRef,
          paid_at: null,
        }),
      );
    });

    const amountInSmallestUnit = Math.round(Number(payment.amount) * 100);
    const paymentUrl = buildVnpayPaymentUrl({
      paymentUrl: vnpayConfig.paymentUrl,
      hashSecret: vnpayConfig.hashSecret,
      params: {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: vnpayConfig.tmnCode,
        vnp_Amount: amountInSmallestUnit,
        vnp_CurrCode: 'VND',
        vnp_TxnRef: payment.provider_txn_id,
        vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
        vnp_OrderType: 'other',
        vnp_Locale: 'vn',
        vnp_ReturnUrl: vnpayConfig.returnUrl,
        vnp_IpAddr: ipAddress || '127.0.0.1',
        vnp_CreateDate: formatVnpayDate(now),
        vnp_ExpireDate: formatVnpayDate(expireDate),
        vnp_BankCode: initiatePaymentDto.bank_code,
      },
    });

    return {
      order_id: orderId,
      payment: this.mapPaymentSummary(payment),
      next_action: {
        type: 'REDIRECT',
        payment_url: paymentUrl,
      },
      message: 'Redirect user to VNPAY payment gateway.',
    };
  }

  async handleVnpayIpn(query: Record<string, string | string[]>) {
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');
    if (!hashSecret) {
      return { RspCode: '99', Message: 'Missing VNPAY configuration' };
    }

    const params = this.flattenVnpayQuery(query);
    if (!verifyVnpSecureHash(params, hashSecret)) {
      return { RspCode: '97', Message: 'Invalid Checksum' };
    }

    const txnRef = params.vnp_TxnRef;
    const receivedAmount = Number(params.vnp_Amount) / 100;
    if (!txnRef || Number.isNaN(receivedAmount)) {
      return { RspCode: '99', Message: 'Invalid request' };
    }

    return this.dataSource.transaction(async (manager) => {
      const payment = await manager
        .getRepository(Payment)
        .createQueryBuilder('payment')
        .innerJoinAndSelect('payment.order', 'ord')
        .innerJoinAndSelect('payment.payment_method', 'payment_method')
        .where('payment.provider_txn_id = :txnRef', { txnRef })
        .setLock('pessimistic_write', undefined, ['payment'])
        .getOne();

      if (!payment) {
        return { RspCode: '01', Message: 'Order not found' };
      }

      if (Math.round(Number(payment.amount)) !== Math.round(receivedAmount)) {
        return { RspCode: '04', Message: 'Invalid amount' };
      }

      if (payment.status !== PaymentStatus.PENDING) {
        return { RspCode: '02', Message: 'Order already confirmed' };
      }

      const isSuccess =
        params.vnp_ResponseCode === '00' &&
        params.vnp_TransactionStatus === '00';

      payment.status = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
      payment.paid_at = isSuccess ? new Date() : null;

      if (isSuccess) {
        payment.order.status = OrderStatus.PAID;
        await manager.save(Order, payment.order);
      }

      await manager.save(Payment, payment);

      return { RspCode: '00', Message: 'Confirm Success' };
    });
  }

  async getOrderPaymentStatusForUser(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
      relations: ['payments', 'payments.payment_method'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payments = [...(order.payments ?? [])].sort(
      (left, right) => right.id - left.id,
    );
    const latestPayment = payments[0] ?? null;

    return {
      order_id: order.id,
      order_status: order.status,
      amount: order.total_amount,
      payment: latestPayment ? this.mapPaymentSummary(latestPayment) : null,
      is_paid:
        order.status === OrderStatus.PAID ||
        payments.some((payment) => payment.status === PaymentStatus.SUCCESS),
    };
  }

  private async processPaymentInternal(
    orderId: number,
    paymentMethodCode: string,
    userId?: number,
  ): Promise<{
    payment: Payment;
    message: string;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderQuery = queryRunner.manager
        .getRepository(Order)
        .createQueryBuilder('ord')
        .innerJoinAndSelect('ord.user', 'user')
        .where('ord.id = :orderId', { orderId })
        .setLock('pessimistic_write', undefined, ['ord']);

      if (userId) {
        orderQuery.andWhere('user.id = :userId', { userId });
      }

      const order = await orderQuery.getOne();

      if (!order) {
        throw new BadRequestException('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Order is not payable');
      }

      const paymentMethod = await this.getActivePaymentMethod(
        paymentMethodCode,
        queryRunner.manager,
      );

      const payment = queryRunner.manager.create(Payment, {
        order,
        payment_method: paymentMethod,
        amount: Number(order.total_amount),
        status: PaymentStatus.PENDING,
        provider_txn_id: null,
        paid_at: null,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      savedPayment.status = PaymentStatus.SUCCESS;
      savedPayment.paid_at = new Date();
      const processedPayment = await queryRunner.manager.save(
        Payment,
        savedPayment,
      );

      order.status = OrderStatus.PAID;
      await queryRunner.manager.save(Order, order);

      await queryRunner.commitTransaction();

      return {
        payment: processedPayment,
        message:
          'Payment successful. Your order has been confirmed.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: number) {
    const payment = await this.findOne(paymentId);
    return this.mapPaymentDetails(payment);
  }

  async getPaymentDetailsForUser(paymentId: number, userId: number) {
    const payment = await this.findOneForUser(paymentId, userId);
    return this.mapPaymentDetails(payment);
  }

  private mapPaymentDetails(payment: Payment) {
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

  private mapPaymentSummary(payment: Payment) {
    return {
      id: payment.id,
      status: payment.status,
      payment_method_code: payment.payment_method.code,
      payment_method_name: payment.payment_method.name,
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
      order: { id: 'ASC' },
    });

    if (payments.length === 0) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payments;
  }

  async getPaymentByOrderIdForUser(
    orderId: number,
    userId: number,
  ): Promise<Payment[]> {
    const payments = await this.paymentRepository.find({
      where: { order: { id: orderId, user: { id: userId } } },
      relations: ['order', 'payment_method'],
      order: { id: 'ASC' },
    });

    if (payments.length === 0) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payments;
  }

  private async getActivePaymentMethod(
    code: string,
    manager?: EntityManager,
  ): Promise<PaymentMethod> {
    const paymentMethodRepository = manager
      ? manager.getRepository(PaymentMethod)
      : this.paymentMethodRepository;

    const paymentMethod = await paymentMethodRepository.findOne({
      where: { code, is_active: true },
    });
    if (!paymentMethod) {
      throw new BadRequestException('Unsupported payment method');
    }

    return paymentMethod;
  }

  private async findPendingOrderForPayment(
    manager: EntityManager,
    orderId: number,
    userId: number,
  ): Promise<Order> {
    const order = await manager
      .getRepository(Order)
      .createQueryBuilder('ord')
      .innerJoinAndSelect('ord.user', 'user')
      .where('ord.id = :orderId', { orderId })
      .andWhere('user.id = :userId', { userId })
      .setLock('pessimistic_write', undefined, ['ord'])
      .getOne();

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not payable');
    }

    return order;
  }

  private getVnpayConfig(returnUrl?: string) {
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');

    if (!tmnCode || !hashSecret) {
      throw new BadRequestException('VNPAY is not configured');
    }

    return {
      tmnCode,
      hashSecret,
      paymentUrl:
        this.configService.get<string>('VNPAY_PAYMENT_URL') ||
        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl:
        returnUrl ||
        this.configService.get<string>('VNPAY_RETURN_URL') ||
        'http://localhost:3000/payment/vnpay-return',
    };
  }

  private generateVnpayTxnRef(orderId: number): string {
    return `PBL7-${orderId}-${Date.now()}`;
  }

  private isVnpayGatewayEnabled(): boolean {
    return (
      this.configService.get<string>('VNPAY_USE_GATEWAY')?.toLowerCase() ===
      'true'
    );
  }

  private flattenVnpayQuery(
    query: Record<string, string | string[]>,
  ): Record<string, string> {
    return Object.entries(query).reduce<Record<string, string>>(
      (flattened, [key, value]) => {
        flattened[key] = Array.isArray(value) ? value[0] : value;
        return flattened;
      },
      {},
    );
  }
}
