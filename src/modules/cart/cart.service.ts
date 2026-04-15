import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { User } from '../user/entities/user.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { CartItem } from '../cartitem/entities/cartitem.entity';
import { MeasureUnit } from '../medicine/entities/measure-unit.entity';
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
    @InjectRepository(MeasureUnit)
    private readonly measureUnitRepository: Repository<MeasureUnit>,
  ) {}

  async create(createCartDto: CreateCartDto): Promise<Cart> {
    const user = await this.userRepository.findOne({
      where: { id: createCartDto.user_id },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
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
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

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
  async addItemToCart(userId: number, addToCartDto: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCartByUserId(userId);

    const product = await this.medicineRepository.findOne({
      where: { id: addToCartDto.product_id },
      relations: ['prices', 'prices.measure_unit'],
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const measureUnit = await this.measureUnitRepository.findOne({
      where: { id: addToCartDto.measure_unit_id },
    });
    if (!measureUnit) {
      throw new BadRequestException('Measure unit not found');
    }

    const selectedPrice = product.prices.find(
      (price) => price.measure_unit.id === measureUnit.id,
    );
    if (!selectedPrice) {
      throw new BadRequestException('Price for selected measure unit not found');
    }

    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: addToCartDto.product_id },
        measure_unit: { id: addToCartDto.measure_unit_id },
      },
    });

    if (cartItem) {
      cartItem.quantity += addToCartDto.quantity;
    } else {
      cartItem = this.cartItemRepository.create({
        quantity: addToCartDto.quantity,
        unit_price_snapshot: selectedPrice.price,
        cart,
        product,
        measure_unit: measureUnit,
      });
    }

    await this.cartItemRepository.save(cartItem);

    return this.findOne(cart.id);
  }

  /**
   * Remove specific item from cart
   */
  async removeItemFromCart(
    userId: number,
    productId: number,
    measureUnitId: number,
  ): Promise<Cart> {
    const cart = await this.getOrCreateCartByUserId(userId);

    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: productId },
        measure_unit: { id: measureUnitId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Item not in cart');
    }

    await this.cartItemRepository.remove(cartItem);
    return this.findOne(cart.id);
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
  async calculateCartTotal(userId: number): Promise<number> {
    const cart = await this.getOrCreateCartByUserId(userId);
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
    const total = await this.calculateCartTotal(userId);

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
}
