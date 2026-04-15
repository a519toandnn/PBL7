import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  create(@Body() createCartDto: CreateCartDto) {
    return this.cartService.create(createCartDto);
  }

  @Get()
  findAll() {
    return this.cartService.findAll();
  }

  // ===== E-Commerce Endpoints =====

  /**
   * GET /cart/user/:userId - Get cart summary for user
   */
  @Get('user/:userId')
  getCartByUserId(@Param('userId') userId: string) {
    return this.cartService.getCartSummary(+userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.update(+id, updateCartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(+id);
  }

  /**
   * POST /cart/user/:userId/add-item - Add item to cart
   */
  @Post('user/:userId/add-item')
  addToCart(
    @Param('userId') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addItemToCart(+userId, addToCartDto);
  }

  /**
   * DELETE /cart/user/:userId/item/:productId/unit/:measureUnitId - Remove item from cart
   */
  @Delete('user/:userId/item/:productId/unit/:measureUnitId')
  removeItemFromCart(
    @Param('userId') userId: string,
    @Param('productId') productId: string,
    @Param('measureUnitId') measureUnitId: string,
  ) {
    return this.cartService.removeItemFromCart(+userId, +productId, +measureUnitId);
  }

  /**
   * DELETE /cart/user/:userId/clear - Clear entire cart
   */
  @Delete('user/:userId/clear')
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(+userId);
  }
}
