import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cartitem.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { CreateCartitemDto } from './dto/create-cartitem.dto';
import { UpdateCartitemDto } from './dto/update-cartitem.dto';

@Injectable()
export class CartitemService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
  ) {}

  async create(createCartitemDto: CreateCartitemDto): Promise<CartItem> {
    const cart = await this.cartRepository.findOne({
      where: { id: createCartitemDto.cart_id },
    });
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }
    const product = await this.medicineRepository.findOne({
      where: { id: createCartitemDto.product_id },
      relations: ['prices', 'prices.measure_unit'],
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const selectedPrice = product.prices.find(
      (price) => price.measure_unit.id === createCartitemDto.measure_unit_id,
    );
    if (!selectedPrice) {
      throw new BadRequestException('Selected unit has no price');
    }

    const cartItem = this.cartItemRepository.create({
      quantity: createCartitemDto.quantity,
      unit_price_snapshot: selectedPrice.price,
      cart,
      product,
      measure_unit: selectedPrice.measure_unit,
    });
    return this.cartItemRepository.save(cartItem);
  }

  async findAll(): Promise<CartItem[]> {
    return this.cartItemRepository.find({
      relations: ['cart', 'product', 'measure_unit'],
    });
  }

  async findOne(id: number): Promise<CartItem> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id },
      relations: ['cart', 'product', 'measure_unit'],
    });
    if (!cartItem) {
      throw new NotFoundException(`Cart Item with ID ${id} not found`);
    }
    return cartItem;
  }

  async update(id: number, updateCartitemDto: UpdateCartitemDto): Promise<CartItem> {
    const cartItem = await this.findOne(id);
    if (updateCartitemDto.quantity !== undefined) {
      cartItem.quantity = updateCartitemDto.quantity;
    }
    return this.cartItemRepository.save(cartItem);
  }

  async remove(id: number): Promise<void> {
    const cartItem = await this.findOne(id);
    await this.cartItemRepository.remove(cartItem);
  }
}
