import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    return this.paymentService.findAllPaginated(page, Math.min(limit, 100));
  }

  // ===== E-Commerce Endpoints =====

  /**
   * GET /payment/vnpay/ipn - VNPAY server-to-server payment notification
   * This endpoint is public, but PaymentService verifies VNPAY secure hash.
   */
  @Get('vnpay/ipn')
  async handleVnpayIpn(
    @Query() query: Record<string, string | string[]>,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.handleVnpayIpn(query);
    return res.status(200).json(result);
  }

  /**
   * GET /payment/vnpay/return - VNPAY browser return URL
   * VNPAY redirects the user's browser here after payment.
   * BE verifies the secure hash, confirms payment, then redirects to FE.
   */
  @Get('vnpay/return')
  async handleVnpayReturn(
    @Query() query: Record<string, string | string[]>,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.handleVnpayReturn(query);

    if (result.redirect_url) {
      return res.redirect(result.redirect_url);
    }

    return res.status(result.success ? 200 : 400).json(result);
  }

  /**
   * POST /payment/order/:orderId/initiate - Create COD payment or VNPAY URL
   */
  @Post('order/:orderId/initiate')
  @UseGuards(JwtGuard)
  initiatePayment(
    @Request() req: any,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() initiatePaymentDto: InitiatePaymentDto,
  ) {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

    return this.paymentService.initiatePaymentForUser(
      orderId,
      req.user.userId,
      initiatePaymentDto,
      ipAddress,
    );
  }

  /**
   * GET /payment/order/:orderId/status - FE polls this after VNPAY return
   */
  @Get('order/:orderId/status')
  @UseGuards(JwtGuard)
  getOrderPaymentStatus(
    @Request() req: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentService.getOrderPaymentStatusForUser(
      orderId,
      req.user.userId,
    );
  }

  /**
   * GET /payment/order/:orderId - Get payment details by order ID
   */
  @Get('order/:orderId')
  @UseGuards(JwtGuard)
  getPaymentByOrderId(
    @Request() req: any,
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentService.getPaymentByOrderIdForUser(
      orderId,
      req.user.userId,
    );
  }

  /**
   * GET /payment/:id/details - Get payment details
   */
  @Get(':id/details')
  @UseGuards(JwtGuard)
  getPaymentDetails(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentService.getPaymentDetailsForUser(id, req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.paymentService.findOneForUser(id, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.paymentService.remove(id);
  }

  /**
   * POST /payment/order/:orderId/process - Process payment for order
   * This will confirm payment for a pending order
   */
  @Post('order/:orderId/process')
  @UseGuards(JwtGuard)
  processPayment(
    @Request() req: any,
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    return this.paymentService.processPaymentForUser(
      orderId,
      req.user.userId,
      processPaymentDto.payment_method_code,
    );
  }
}
