import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  // ===== E-Commerce Endpoints =====

  /**
   * GET /payment/order/:orderId - Get payment details by order ID
   */
  @Get('order/:orderId')
  getPaymentByOrderId(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.paymentService.getPaymentByOrderId(orderId);
  }

  /**
   * GET /payment/:id/details - Get payment details
   */
  @Get(':id/details')
  getPaymentDetails(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.getPaymentDetails(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.remove(id);
  }

  /**
   * POST /payment/order/:orderId/process - Process payment for order
   * This will confirm payment and clear user's cart
   */
  @Post('order/:orderId/process')
  processPayment(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    return this.paymentService.processPayment(orderId, processPaymentDto.payment_method_code);
  }
}
