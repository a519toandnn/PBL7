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
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
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
   * This will confirm payment and clear user's cart
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
