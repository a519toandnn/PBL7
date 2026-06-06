import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { User } from '../user/entities/user.entity';
import { Medicine } from '../medicine/entities/medicine.entity';
import { CartItem } from '../cartitem/entities/cartitem.entity';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import {
  ImportPrescriptionCartDto,
  PrescriptionMedicineItemDto,
} from './dto/import-prescription-cart.dto';
import { MedicineService } from '../medicine/medicine.service';
import { MedicineSearchItemDto } from '../medicine/dto/medicine-search.dto';
import { MedicinePrice } from '../medicine/entities/medicine-price.entity';

type PrescriptionWarningType =
  | 'INVALID_INPUT'
  | 'INVALID_QUANTITY'
  | 'SEARCH_FAILED'
  | 'NOT_FOUND'
  | 'MEASURE_UNIT_NOT_FOUND'
  | 'CONSULT_REQUIRED';

interface PrescriptionWarning {
  type: PrescriptionWarningType;
  inputs: PrescriptionMedicineItemDto[];
  message: string;
}

interface PrescriptionInputGroup {
  searchName: string;
  normalizedName: string;
  normalizedUnit: string;
  displayUnit: string;
  quantity: number;
  inputs: PrescriptionMedicineItemDto[];
}

interface GroupSearchResult {
  group: PrescriptionInputGroup;
  candidates: MedicineSearchItemDto[];
  warning?: PrescriptionWarning;
}

interface MatchedPrescriptionItem {
  group: PrescriptionInputGroup;
  candidate: MedicineSearchItemDto;
  product: Medicine;
  price: MedicinePrice;
}

interface GroupedCartUpsertItem {
  product: Medicine;
  price: MedicinePrice;
  quantity: number;
  matches: MatchedPrescriptionItem[];
}

@Injectable()
export class CartService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly medicineService: MedicineService,
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

  async importPrescriptionItemsToCart(
    userId: number,
    dto: ImportPrescriptionCartDto,
  ): Promise<any> {
    await this.validateUserExists(userId);

    const rawItems = dto.data?.danh_sach_thuoc;
    if (!Array.isArray(rawItems)) {
      throw new BadRequestException('danh_sach_thuoc must be an array');
    }

    const requestedCount = rawItems.length;
    const maxItems = this.getPositiveConfigInt(
      'PRESCRIPTION_IMPORT_MAX_ITEMS',
      50,
    );

    if (requestedCount > maxItems) {
      throw new BadRequestException(
        `danh_sach_thuoc must contain at most ${maxItems} items`,
      );
    }

    const { groups, warnings } = this.groupPrescriptionInputs(rawItems);

    const searchResults = await this.searchPrescriptionGroups(groups);
    warnings.push(
      ...searchResults
        .map((result) => result.warning)
        .filter((warning): warning is PrescriptionWarning => Boolean(warning)),
    );

    const productMap = await this.loadCandidateProducts(searchResults);
    const matches: MatchedPrescriptionItem[] = [];

    for (const result of searchResults) {
      if (result.warning) {
        continue;
      }

      if (result.candidates.length === 0) {
        warnings.push({
          type: 'NOT_FOUND',
          inputs: result.group.inputs,
          message: `Không tìm thấy sản phẩm phù hợp cho ${result.group.searchName}`,
        });
        continue;
      }

      const match = this.selectBestCandidateWithUnit(result, productMap);
      if (!match) {
        const topCandidateProduct = this.getTopCandidateProduct(
          result,
          productMap,
        );

        if (
          topCandidateProduct &&
          this.isConsultRequiredProduct(topCandidateProduct)
        ) {
          warnings.push({
            type: 'CONSULT_REQUIRED',
            inputs: result.group.inputs,
            message: this.buildConsultRequiredMessage(result.group.searchName),
          });
          continue;
        }

        warnings.push({
          type: 'MEASURE_UNIT_NOT_FOUND',
          inputs: result.group.inputs,
          message: `Không tìm thấy sản phẩm phù hợp cho ${result.group.searchName}`,
        });
        continue;
      }

      if (this.isConsultRequiredPrice(match.price.price)) {
        warnings.push({
          type: 'CONSULT_REQUIRED',
          inputs: result.group.inputs,
          message: this.buildConsultRequiredMessage(result.group.searchName),
        });
        continue;
      }

      matches.push(match);
    }

    const groupedUpserts = this.buildCartUpsertItems(matches);
    const upsertedCartItems =
      groupedUpserts.length > 0
        ? await this.upsertPrescriptionCartItems(userId, groupedUpserts)
        : [];
    const cartItemByKey = new Map(
      upsertedCartItems.map((item) => [
        this.getCartItemKey(item.product.id, item.measure_unit!.id),
        item,
      ]),
    );

    const matchedItems = matches.map((match) => {
      const cartItem = cartItemByKey.get(
        this.getCartItemKey(match.product.id, match.price.measure_unit.id),
      );

      return {
        inputs: match.group.inputs,
        cart_item: cartItem
          ? this.mapCartItemResponse(cartItem.cart.id, cartItem)
          : null,
        match: {
          query: match.group.searchName,
          matched_product_id: match.product.id,
          matched_product_name: match.product.name,
          measure_unit_name: match.price.measure_unit.name,
          match_type: match.candidate.match_type,
          score: match.candidate.score,
        },
      };
    });

    const cartUpserts = groupedUpserts.map((item) => {
      const cartItem = cartItemByKey.get(
        this.getCartItemKey(item.product.id, item.price.measure_unit.id),
      );

      return {
        product_id: item.product.id,
        measure_unit_id: item.price.measure_unit.id,
        quantity_added: item.quantity,
        cart_item_id: cartItem?.id ?? null,
      };
    });

    const cart = await this.getCartSummary(userId);

    return {
      matched_items: matchedItems,
      cart_upserts: cartUpserts,
      warnings,
      summary: {
        requested_count: requestedCount,
        valid_group_count: groups.length,
        matched_count: matches.length,
        cart_upsert_count: groupedUpserts.length,
        warning_count: warnings.length,
      },
      cart,
    };
  }

  private groupPrescriptionInputs(rawItems: PrescriptionMedicineItemDto[]) {
    const groupMap = new Map<string, PrescriptionInputGroup>();
    const warnings: PrescriptionWarning[] = [];

    for (const item of rawItems) {
      const searchName = this.normalizeMedicineName(item.ten_thuoc);
      const displayUnit = this.normalizeDisplayText(item.don_vi_tinh);
      const normalizedUnit = this.normalizeMeasureUnitName(item.don_vi_tinh);

      if (!searchName || !displayUnit) {
        warnings.push({
          type: 'INVALID_INPUT',
          inputs: [item],
          message: 'Thông tin thuốc không hợp lệ',
        });
        continue;
      }

      const quantity = this.parsePositiveInteger(item.so_luong);
      if (quantity === null) {
        warnings.push({
          type: 'INVALID_QUANTITY',
          inputs: [item],
          message: `Số lượng của ${searchName} không hợp lệ`,
        });
        continue;
      }

      const normalizedName = searchName.toLocaleLowerCase('vi-VN');
      const groupKey = `${normalizedName}:${normalizedUnit}`;
      const existing = groupMap.get(groupKey);

      if (existing) {
        existing.quantity += quantity;
        existing.inputs.push(item);
        continue;
      }

      groupMap.set(groupKey, {
        searchName,
        normalizedName,
        normalizedUnit,
        displayUnit,
        quantity,
        inputs: [item],
      });
    }

    return {
      groups: Array.from(groupMap.values()),
      warnings,
    };
  }

  private async searchPrescriptionGroups(
    groups: PrescriptionInputGroup[],
  ): Promise<GroupSearchResult[]> {
    const concurrency = this.getPositiveConfigInt(
      'PRESCRIPTION_IMPORT_SEARCH_CONCURRENCY',
      3,
    );
    const limit = Math.min(
      this.getPositiveConfigInt('PRESCRIPTION_IMPORT_SEARCH_LIMIT', 5),
      5,
    );

    return this.mapWithConcurrency(groups, concurrency, async (group) => {
      try {
        const result = await this.medicineService.search(
          group.searchName,
          1,
          limit,
        );

        return {
          group,
          candidates: result.data,
        };
      } catch {
        return {
          group,
          candidates: [],
          warning: {
            type: 'SEARCH_FAILED',
            inputs: group.inputs,
            message: `Không thể tìm sản phẩm phù hợp cho ${group.searchName}`,
          },
        };
      }
    });
  }

  private async loadCandidateProducts(searchResults: GroupSearchResult[]) {
    const candidateIds = Array.from(
      new Set(
        searchResults.flatMap((result) =>
          result.candidates.map((candidate) => candidate.id),
        ),
      ),
    );

    if (candidateIds.length === 0) {
      return new Map<number, Medicine>();
    }

    const products = await this.medicineRepository.find({
      where: { id: In(candidateIds) },
      relations: ['prices', 'prices.measure_unit'],
    });

    return new Map(products.map((product) => [product.id, product]));
  }

  private selectBestCandidateWithUnit(
    searchResult: GroupSearchResult,
    productMap: Map<number, Medicine>,
  ): MatchedPrescriptionItem | null {
    for (const candidate of searchResult.candidates) {
      const product = productMap.get(candidate.id);
      const price = product?.prices?.find(
        (productPrice) =>
          productPrice.measure_unit &&
          this.normalizeMeasureUnitName(productPrice.measure_unit.name) ===
            searchResult.group.normalizedUnit,
      );

      if (product && price) {
        return {
          group: searchResult.group,
          candidate,
          product,
          price,
        };
      }
    }

    return null;
  }

  private getTopCandidateProduct(
    searchResult: GroupSearchResult,
    productMap: Map<number, Medicine>,
  ): Medicine | null {
    const topCandidate = searchResult.candidates[0];
    if (!topCandidate) {
      return null;
    }

    return productMap.get(topCandidate.id) ?? null;
  }

  private isConsultRequiredProduct(product: Medicine): boolean {
    const prices = product.prices ?? [];
    if (prices.length === 0) {
      return true;
    }

    return !prices.some((price) => !this.isConsultRequiredPrice(price.price));
  }

  private buildCartUpsertItems(matches: MatchedPrescriptionItem[]) {
    const itemMap = new Map<string, GroupedCartUpsertItem>();

    for (const match of matches) {
      const key = this.getCartItemKey(
        match.product.id,
        match.price.measure_unit.id,
      );
      const existing = itemMap.get(key);

      if (existing) {
        existing.quantity += match.group.quantity;
        existing.matches.push(match);
        continue;
      }

      itemMap.set(key, {
        product: match.product,
        price: match.price,
        quantity: match.group.quantity,
        matches: [match],
      });
    }

    return Array.from(itemMap.values());
  }

  private async upsertPrescriptionCartItems(
    userId: number,
    items: GroupedCartUpsertItem[],
  ): Promise<CartItem[]> {
    return this.dataSource.transaction(async (manager) => {
      const cart = await this.getOrCreateCartByUserIdInTransaction(
        manager,
        userId,
      );
      const params: Array<number | string> = [];
      const values = items
        .map((item, index) => {
          const offset = index * 5;
          params.push(
            cart.id,
            item.product.id,
            item.price.measure_unit.id,
            item.quantity,
            String(item.price.price),
          );
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
        })
        .join(', ');

      const rows = await manager.query(
        `
          INSERT INTO cart_items (
            cart_id,
            product_id,
            measure_unit_id,
            quantity,
            unit_price_snapshot
          )
          VALUES ${values}
          ON CONFLICT (cart_id, product_id, measure_unit_id)
          DO UPDATE SET
            quantity = cart_items.quantity + EXCLUDED.quantity,
            unit_price_snapshot = EXCLUDED.unit_price_snapshot
          RETURNING id
        `,
        params,
      );
      const ids = rows.map((row: { id: number | string }) => Number(row.id));

      return manager.find(CartItem, {
        where: { id: In(ids) },
        relations: ['cart', 'product', 'measure_unit'],
      });
    });
  }

  private async getOrCreateCartByUserIdInTransaction(
    manager: EntityManager,
    userId: number,
  ): Promise<Cart> {
    const user = await manager.findOne(User, { where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let cart = await manager.findOne(Cart, {
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!cart) {
      cart = await manager.save(Cart, manager.create(Cart, { user }));
    }

    return cart;
  }

  private normalizeMedicineName(value?: string | null): string {
    return this.normalizeDisplayText(value);
  }

  private normalizeDisplayText(value?: string | null): string {
    return value?.trim().replace(/\s+/g, ' ') ?? '';
  }

  private normalizeMeasureUnitName(value?: string | null): string {
    return this.normalizeDisplayText(value).toLocaleLowerCase('vi-VN');
  }

  private parsePositiveInteger(value: string | number): number | null {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return null;
    }

    return quantity;
  }

  private isConsultRequiredPrice(value: unknown): boolean {
    const price = Number(value);
    return !Number.isFinite(price) || price <= 0;
  }

  private buildConsultRequiredMessage(name: string): string {
    return `Loại thuốc với tên là ${name} cần phải có tư vấn của dược sĩ, bạn vui lòng ra tiệm thuốc gần nhất để được tư vấn thêm`;
  }

  private getCartItemKey(productId: number, measureUnitId: number): string {
    return `${productId}:${measureUnitId}`;
  }

  private getPositiveConfigInt(name: string, defaultValue: number): number {
    const value = Number(this.configService.get<string>(name));
    return Number.isInteger(value) && value > 0 ? value : defaultValue;
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<R>,
  ): Promise<R[]> {
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    const workerCount = Math.min(concurrency, items.length);

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (nextIndex < items.length) {
          const currentIndex = nextIndex;
          nextIndex++;
          results[currentIndex] = await worker(items[currentIndex], currentIndex);
        }
      }),
    );

    return results;
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
