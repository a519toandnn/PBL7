import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ===== E-Commerce Endpoints (Authenticated User) =====

  /**
   * GET /cart - Get current user's cart summary
   */
  @Get()
  @UseGuards(JwtGuard)
  getMyCart(@Request() req: any) {
    return this.cartService.getCartSummary(req.user.userId);
  }

  /**
   * POST /cart/add - Add item to current user's cart
   */
  @Post('add')
  @UseGuards(JwtGuard)
  addToCart(@Request() req: any, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addItemToCart(req.user.userId, addToCartDto);
  }

  /**
   * DELETE /cart/item/:productId/unit/:measureUnitId - Remove item from current user's cart
   */
  @Delete('item/:productId/unit/:measureUnitId')
  @UseGuards(JwtGuard)
  removeItemFromCart(
    @Request() req: any,
    @Param('productId') productId: string,
    @Param('measureUnitId') measureUnitId: string,
  ) {
    return this.cartService.removeItemFromCart(req.user.userId, +productId, +measureUnitId);
  }

  /**
   * DELETE /cart/clear - Clear current user's cart
   */
  @Delete('clear')
  @UseGuards(JwtGuard)
  clearCart(@Request() req: any) {
    return this.cartService.clearCart(req.user.userId);
  }
}
