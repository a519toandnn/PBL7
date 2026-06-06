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
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get('admin')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    return this.orderService.findAllPaginated(page, Math.min(limit, 100));
  }

  // ===== E-Commerce Endpoints =====

  /**
   * GET /order - Get all orders for current user
   */
  @Get()
  @UseGuards(JwtGuard)
  getMyOrders(@Request() req: any) {
    return this.orderService.getOrdersByUserId(req.user.userId);
  }

  /**
   * GET /order/user/:userId - Admin: Get all orders for a user
   */
  @Get('user/:userId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getOrdersByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.orderService.getOrdersByUserId(userId);
  }

  /**
   * GET /order/admin/:id/details - Admin: Get any order details
   */
  @Get('admin/:id/details')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAdminOrderDetails(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.getOrderDetails(id);
  }

  /**
   * GET /order/:id/details - Get order details with items
   */
  @Get(':id/details')
  @UseGuards(JwtGuard)
  getOrderDetails(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    if (req.user?.role === UserRole.ADMIN) {
      return this.orderService.getOrderDetails(id);
    }

    return this.orderService.getOrderDetailsForUser(id, req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    if (req.user?.role === UserRole.ADMIN) {
      return this.orderService.getOrderDetails(id);
    }

    return this.orderService.getOrderDetailsForUser(id, req.user.userId);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.remove(id);
  }

  /**
   * POST /order/checkout - Checkout current user's cart to create order
   */
  @Post('checkout')
  @UseGuards(JwtGuard)
  checkout(@Request() req: any, @Body() checkoutDto: CheckoutDto) {
    return this.orderService.createOrderFromCart(
      req.user.userId,
      checkoutDto.cart_item_ids,
      checkoutDto.address_id,
      checkoutDto.note,
    );
  }
}
