import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { User } from '../user/entities/user.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { CartItem } from '../cartitem/entities/cartitem.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  /**
   * Private helper: Validate user existence
   */
  private async validateUserExists(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async create(createCartDto: CreateCartDto): Promise<Cart> {
    const user = await this.validateUserExists(createCartDto.user_id);
    const cart = this.cartRepository.create({ user });
    return this.cartRepository.save(cart);
  }

  async findAll(): Promise<Cart[]> {
    return this.cartRepository.find({
      relations: ['user', 'items', 'items.product', 'items.measure_unit'],
    });
  }

  async findOne(id: number): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id },
      relations: ['user', 'items', 'items.product', 'items.measure_unit'],
    });
    if (!cart) {
      throw new NotFoundException(`Cart with ID ${id} not found`);
    }
    return cart;
  }

  async update(id: number, updateCartDto: UpdateCartDto): Promise<Cart> {
    const cart = await this.findOne(id);
    Object.assign(cart, updateCartDto);
    return this.cartRepository.save(cart);
  }

  async remove(id: number): Promise<void> {
    const cart = await this.findOne(id);
    await this.cartRepository.remove(cart);
  }

  // ===== New Methods for E-Commerce Features =====

  /**
   * Get or create cart for a user
   */
  async getOrCreateCartByUserId(userId: number): Promise<Cart> {
    const user = await this.validateUserExists(userId);

    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'items', 'items.product', 'items.measure_unit'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ user });
      cart = await this.cartRepository.save(cart);
      cart = await this.cartRepository.findOne({
        where: { id: cart.id },
        relations: ['user', 'items', 'items.product', 'items.measure_unit'],
      });
    }

    return cart!;
  }

  /**
   * Add item to cart or update quantity if exists
   */
  async addItemToCart(
    userId: number,
    addToCartDto: AddToCartDto,
  ) {
    const cart = await this.getOrCreateCartByUserId(userId);

    const product = await this.medicineRepository.findOne({
      where: { id: addToCartDto.product_id },
      relations: ['prices', 'prices.measure_unit'],
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const selectedPrice = product.prices.find(
      (price) => price.measure_unit.id === addToCartDto.measure_unit_id,
    );
    if (!selectedPrice) {
      throw new BadRequestException(
        'Price for selected measure unit not found',
      );
    }

    const upsertResult = await this.cartItemRepository.query(
      `
        INSERT INTO cart_items (
          cart_id,
          product_id,
          measure_unit_id,
          quantity,
          unit_price_snapshot
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (cart_id, product_id, measure_unit_id)
        DO UPDATE SET
          quantity = cart_items.quantity + EXCLUDED.quantity,
          unit_price_snapshot = EXCLUDED.unit_price_snapshot
        RETURNING id
      `,
      [
        cart.id,
        addToCartDto.product_id,
        addToCartDto.measure_unit_id,
        addToCartDto.quantity,
        selectedPrice.price,
      ],
    );

    const cartItem = await this.cartItemRepository.findOne({
      where: { id: Number(upsertResult[0].id) },
      relations: ['product', 'measure_unit'],
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found after add');
    }

    return this.mapCartItemResponse(cart.id, cartItem);
  }

  /**
   * Remove specific item from cart
   */
  async removeItemFromCart(
    userId: number,
    productId: number,
    measureUnitId: number,
  ) {
    const cart = await this.getOrCreateCartByUserId(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: productId },
        measure_unit: { id: measureUnitId },
      },
      relations: ['product', 'measure_unit'],
    });

    if (!cartItem) {
      throw new NotFoundException('Item not in cart');
    }

    const removedItem = this.mapCartItemResponse(cart.id, cartItem);
    await this.cartItemRepository.remove(cartItem);
    return removedItem;
  }

  /**
   * Clear all items from cart
   */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.getOrCreateCartByUserId(userId);
    await this.cartItemRepository.remove(cart.items);
  }

  /**
   * Calculate total price of cart
   */
  private calculateCartTotalFromCart(cart: Cart): number {
    let total = 0;

    for (const item of cart.items) {
      total += Number(item.unit_price_snapshot ?? 0) * item.quantity;
    }

    return total;
  }

  /**
   * Get cart summary
   */
  async getCartSummary(userId: number) {
    const cart = await this.getOrCreateCartByUserId(userId);
    const total = this.calculateCartTotalFromCart(cart);

    return {
      cart_id: cart.id,
      user_id: cart.user.id,
      items: cart.items.map((item) => ({
        cart_item_id: item.id,
        product_id: item.product.id,
        product_name: item.product.name,
        measure_unit_id: item.measure_unit?.id ?? null,
        measure_unit_name: item.measure_unit?.name ?? null,
        unit_price: item.unit_price_snapshot,
        quantity: item.quantity,
        subtotal: Number(item.unit_price_snapshot ?? 0) * item.quantity,
      })),
      total_items: cart.items.length,
      total_price: total,
    };
  }

  private mapCartItemResponse(cartId: number, item: CartItem) {
    return {
      cart_id: cartId,
      cart_item_id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
      },
      measure_unit: item.measure_unit
        ? {
            id: item.measure_unit.id,
            name: item.measure_unit.name,
          }
        : null,
      quantity: item.quantity,
      unit_price: item.unit_price_snapshot,
      subtotal: Number(item.unit_price_snapshot ?? 0) * item.quantity,
    };
  }
}
