import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.orderService.findAll();
  }

  // ===== E-Commerce Endpoints =====

  /**
   * GET /order/user/:userId - Get all orders for user
   */
  @Get('user/:userId')
  @UseGuards(JwtGuard)
  getOrdersByUserId(@Param('userId') userId: string, @Request() req: any) {
    const requestedId = Number(userId);
    const isAdmin = req.user?.role === UserRole.ADMIN;
    if (!isAdmin && req.user?.userId !== requestedId) {
      throw new ForbiddenException('You can only view your own orders');
    }
    return this.orderService.getOrdersByUserId(+userId);
  }

  /**
   * GET /order/:id/details - Get order details with items
   */
  @Get(':id/details')
  @UseGuards(JwtGuard)
  getOrderDetails(@Param('id') id: string) {
    return this.orderService.getOrderDetails(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(+id, updateOrderDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
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
