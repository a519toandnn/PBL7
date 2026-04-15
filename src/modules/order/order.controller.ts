import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  // ===== E-Commerce Endpoints =====

  /**
   * GET /order/user/:userId - Get all orders for user
   */
  @Get('user/:userId')
  getOrdersByUserId(@Param('userId') userId: string) {
    return this.orderService.getOrdersByUserId(+userId);
  }

  /**
   * GET /order/:id/details - Get order details with items
   */
  @Get(':id/details')
  getOrderDetails(@Param('id') id: string) {
    return this.orderService.getOrderDetails(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(+id);
  }

  /**
   * POST /order/user/:userId/checkout - Checkout cart to create order
   */
  @Post('user/:userId/checkout')
  checkout(
    @Param('userId') userId: string,
    @Body() checkoutDto: CheckoutDto,
  ) {
    return this.orderService.createOrderFromCart(+userId, checkoutDto.note);
  }
}
