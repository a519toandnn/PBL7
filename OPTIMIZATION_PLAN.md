# Ke hoach toi uu hieu nang (de xuat)

Ngay: 2026-04-30

Tai lieu nay mo ta cu the nhung thay doi toi du kien toi uu. Moi muc gom doan code hien tai (cu) va doan code moi (de xuat). Tat ca de xuat chua duoc apply vao codebase.

## 1) Giam N+1 trong tao don hang

**Van de**: Tao don hang lap qua tung item va moi vong lap goi DB lay product + measure unit.

**Vi tri**: OrderService.create() trong src/modules/order/order.service.ts

**Cu (hien tai)**
```ts
for (const item of createOrderDto.items) {
  const product = await this.medicineRepository.findOne({
    where: { id: item.product_id },
    relations: ['prices', 'prices.measure_unit'],
  });
  if (!product) {
    throw new BadRequestException(`Product ${item.product_id} not found`);
  }

  const unit = await this.measureUnitRepository.findOne({
    where: { id: item.measure_unit_id },
  });
  if (!unit) {
    throw new BadRequestException(`Measure unit ${item.measure_unit_id} not found`);
  }

  const priceRow = product.prices.find(
    (price) => price.measure_unit.id === item.measure_unit_id,
  );
  if (!priceRow) {
    throw new BadRequestException(
      `No price for product ${item.product_id} and measure unit ${item.measure_unit_id}`,
    );
  }

  const lineTotal = Number(priceRow.price) * item.quantity;
  totalAmount += lineTotal;

  const orderItem = this.orderItemRepository.create({
    order: savedOrder,
    product,
    product_name_snapshot: product.name,
    measure_unit_name_snapshot: unit.name,
    quantity: item.quantity,
    unit_price: Number(priceRow.price),
    line_total: lineTotal,
  });

  orderItems.push(orderItem);
}
```

**Moi (de xuat)**
```ts
const uniqueProductIds = Array.from(
  new Set(createOrderDto.items.map((item) => item.product_id)),
);

const products = await this.medicineRepository.find({
  where: { id: In(uniqueProductIds) },
  relations: ['prices', 'prices.measure_unit'],
});

if (products.length !== uniqueProductIds.length) {
  const foundIds = new Set(products.map((product) => product.id));
  const missing = uniqueProductIds.filter((id) => !foundIds.has(id));
  throw new BadRequestException(`Product not found: ${missing.join(', ')}`);
}

const productMap = new Map(products.map((product) => [product.id, product]));

for (const item of createOrderDto.items) {
  const product = productMap.get(item.product_id) as Medicine;
  const priceRow = product.prices.find(
    (price) => price.measure_unit.id === item.measure_unit_id,
  );
  if (!priceRow) {
    throw new BadRequestException(
      `No price for product ${item.product_id} and measure unit ${item.measure_unit_id}`,
    );
  }

  const lineTotal = Number(priceRow.price) * item.quantity;
  totalAmount += lineTotal;

  const orderItem = this.orderItemRepository.create({
    order: savedOrder,
    product,
    product_name_snapshot: product.name,
    measure_unit_name_snapshot: priceRow.measure_unit.name,
    quantity: item.quantity,
    unit_price: Number(priceRow.price),
    line_total: lineTotal,
  });

  orderItems.push(orderItem);
}
```

**Chi tiet thay doi (what/how)**:
- Gom tat ca `product_id` duy nhat tu danh sach items.
- Load tat ca products (kem prices + measure_unit) trong 1 query.
- Tao `Map` de tra cuu product theo id O(1).
- Lay `measure_unit_name_snapshot` tu quan he price (khong query them).

**Tac dong / Ly do toi uu**:
- Giam so query tu O(n) xuong ~1 query load products + 1 insert batch.
- Giam do tre khi don hang co nhieu item (khong con per-item DB round-trip).
- Van giu validate day du: thieu product hoac thieu price deu bao loi.

**Rui ro / Tac dong phu**:
- Can them import `In` neu chua co trong file.
- Neu danh sach items rat lon, query IN co the nang; can can nhac batch hoac gioi han.

**Goi y kiem thu**:
- Tao don hang voi 1 item va nhieu item (>=10) de so sanh so query.
- Truong hop thieu product hoac thieu price -> expect error.
- Truong hop item co measure_unit khong ton tai trong prices -> expect error.

---

## 2) Giam truy van du thua khi tinh tong gio hang

**Van de**: `getCartSummary()` goi `calculateCartTotal()` va ham nay goi `getOrCreateCartByUserId()` lan nua -> load cart 2 lan.

**Vi tri**: CartService.getCartSummary() va CartService.calculateCartTotal() trong src/modules/cart/cart.service.ts

**Cu (hien tai)**
```ts
async calculateCartTotal(userId: number): Promise<number> {
  const cart = await this.getOrCreateCartByUserId(userId);
  let total = 0;

  for (const item of cart.items) {
    total += Number(item.unit_price_snapshot ?? 0) * item.quantity;
  }

  return total;
}

async getCartSummary(userId: number) {
  const cart = await this.getOrCreateCartByUserId(userId);
  const total = await this.calculateCartTotal(userId);

  return { /* ... */ };
}
```

**Moi (de xuat)**
```ts
private calculateCartTotalFromCart(cart: Cart): number {
  let total = 0;

  for (const item of cart.items) {
    total += Number(item.unit_price_snapshot ?? 0) * item.quantity;
  }

  return total;
}

async getCartSummary(userId: number) {
  const cart = await this.getOrCreateCartByUserId(userId);
  const total = this.calculateCartTotalFromCart(cart);

  return { /* ... */ };
}
```

**Chi tiet thay doi (what/how)**:
- Thay `calculateCartTotal(userId)` bang helper nhan `cart` da load.
- Dung lai cung mot `cart` trong `getCartSummary()`.

**Tac dong / Ly do toi uu**:
- Bo 1 lan load cart bi trung.
- Giam do tre va tai DB khi goi summary nhieu lan.

**Rui ro / Tac dong phu**:
- Dam bao helper moi khong bi goi tu noi khac ma thieu cart.

**Goi y kiem thu**:
- Goi getCartSummary khi cart rong va khi cart co items.
- Kiem tra total va subtotal khong thay doi truoc/sau.

---

## 3) Bo truy van measure unit du thua khi them item vao cart

**Trung lap hay khong?**
- Khong trung lap ve vi tri. Muc 3 ap dung cho `CartService.addItemToCart()` (flow them vao gio hang theo user).
- Muc 4 ap dung cho `CartitemService.create()` (flow tao cart item tu cart_id).
- Ca 2 giong nhau ve y tuong toi uu, nhung la 2 endpoint/entry-point khac nhau.

**Problem**: `product` da duoc load voi `prices` va `prices.measure_unit`, nhung code van query them `measure_units` bang id.

**Vi tri**: CartService.addItemToCart() trong src/modules/cart/cart.service.ts

**Cu (hien tai)**
```ts
const measureUnit = await this.measureUnitRepository.findOne({
  where: { id: addToCartDto.measure_unit_id },
});
if (!measureUnit) {
  throw new BadRequestException('Measure unit not found');
}

const selectedPrice = product.prices.find(
  (price) => price.measure_unit.id === measureUnit.id,
);

cartItem = this.cartItemRepository.create({
  quantity: addToCartDto.quantity,
  unit_price_snapshot: selectedPrice.price,
  cart,
  product,
  measure_unit: measureUnit,
});
```

**Moi (de xuat)**
```ts
const selectedPrice = product.prices.find(
  (price) => price.measure_unit.id === addToCartDto.measure_unit_id,
);

cartItem = this.cartItemRepository.create({
  quantity: addToCartDto.quantity,
  unit_price_snapshot: selectedPrice.price,
  cart,
  product,
  measure_unit: selectedPrice.measure_unit,
});
```

**Chi tiet thay doi (what/how)**:
- Bo `measureUnitRepository.findOne(...)`.
- Dung `selectedPrice.measure_unit` khi tao `CartItem`.
- Validate van duoc giu qua `selectedPrice` (khong co price -> error).

**Tac dong / Ly do toi uu**:
- Giam 1 query moi request add-to-cart.
- Giam do tre va giam tai doc cho bang `measure_units`.
- Hanh vi giu nguyen vi measure unit den tu cung dong price.

**Rui ro / Tac dong phu**:
- Phai dam bao `prices.measure_unit` duoc load trong query product.

**Goi y kiem thu**:
- Add-to-cart voi measure_unit hop le.
- Add-to-cart voi measure_unit khong co gia -> expect error.

---

## 4) Bo truy van measure unit du thua khi tao cart item

**Problem**: Giong muc 3 nhung o service khac.

**Vi tri**: CartitemService.create() trong src/modules/cartitem/cartitem.service.ts

**Cu (hien tai)**
```ts
const measureUnit = await this.measureUnitRepository.findOne({
  where: { id: createCartitemDto.measure_unit_id },
});
if (!measureUnit) {
  throw new BadRequestException('Measure unit not found');
}

const selectedPrice = product.prices.find(
  (price) => price.measure_unit.id === createCartitemDto.measure_unit_id,
);

const cartItem = this.cartItemRepository.create({
  quantity: createCartitemDto.quantity,
  unit_price_snapshot: selectedPrice.price,
  cart,
  product,
  measure_unit: measureUnit,
});
```

**Moi (de xuat)**
```ts
const selectedPrice = product.prices.find(
  (price) => price.measure_unit.id === createCartitemDto.measure_unit_id,
);

const cartItem = this.cartItemRepository.create({
  quantity: createCartitemDto.quantity,
  unit_price_snapshot: selectedPrice.price,
  cart,
  product,
  measure_unit: selectedPrice.measure_unit,
});
```

**Chi tiet thay doi (what/how)**:
- Bo `measureUnitRepository.findOne(...)`.
- Dung `selectedPrice.measure_unit` de gan vao `cartItem.measure_unit`.

**Tac dong / Ly do toi uu**:
- Giam 1 query moi request tao cart item.
- Giam do tre DB cho luong request tu admin/other flow.
- Hanh vi giu nguyen vi measure unit da duoc load kem price.

**Rui ro / Tac dong phu**:
- Phai dam bao `prices.measure_unit` duoc load trong query product.

**Goi y kiem thu**:
- Tao cart item voi measure_unit hop le.
- Tao cart item voi measure_unit khong co gia -> expect error.

---

## 5) Toi uu listing thuoc: bo count query khong dung va giam hydrate object

**Van de**: `getManyAndCount()` tra ve count nhung khong su dung; `leftJoinAndSelect` + hydrate object chi de map nhanh.

**Vi tri**: MedicineService.findAllPaginated() trong src/modules/medicine/medicine.service.ts

**Cu (hien tai)**
```ts
const query = this.medicineRepository
  .createQueryBuilder('m')
  .leftJoinAndSelect(
    'm.prices',
    'p',
    'p.is_sell_default = :default',
    { default: true },
  )
  .leftJoinAndSelect('p.measure_unit', 'mu')
  .select([
    'm.id',
    'm.slug',
    'm.name',
    'm.image_url',
    'm.product_type',
    'm.created_at',
    'p.price',
    'mu.name',
  ])
  .where('m.is_active = :active', { active: true })
  .andWhere('m.deleted_at IS NULL')
  .addOrderBy('m.created_at', 'ASC')
  .addOrderBy('m.id', 'ASC')
  .skip(skip)
  .take(limit);

const [medicines, total] = await query.getManyAndCount();

return medicines.map((m: any) => ({
  id: m.id,
  slug: m.slug,
  name: m.name,
  image_url: m.image_url,
  product_type: m.product_type,
  price: m.prices?.[0]?.price || 0,
  measure_unit_name: m.prices?.[0]?.measure_unit?.name || '',
  is_sell_default: true,
}));
```

**Moi (de xuat)**
```ts
const query = this.medicineRepository
  .createQueryBuilder('m')
  .leftJoin('m.prices', 'p', 'p.is_sell_default = :default', { default: true })
  .leftJoin('p.measure_unit', 'mu')
  .select('m.id', 'id')
  .addSelect('m.slug', 'slug')
  .addSelect('m.name', 'name')
  .addSelect('m.image_url', 'image_url')
  .addSelect('m.product_type', 'product_type')
  .addSelect('m.created_at', 'created_at')
  .addSelect('p.price', 'price')
  .addSelect('mu.name', 'measure_unit_name')
  .where('m.is_active = :active', { active: true })
  .andWhere('m.deleted_at IS NULL')
  .addOrderBy('m.created_at', 'ASC')
  .addOrderBy('m.id', 'ASC')
  .skip(skip)
  .take(limit);

const rows = await query.getRawMany();

return rows.map((row: any) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  image_url: row.image_url,
  product_type: row.product_type,
  price: row.price ? Number(row.price) : 0,
  measure_unit_name: row.measure_unit_name ?? '',
  is_sell_default: true,
}));
```

**Chi tiet thay doi (what/how)**:
- Doi `leftJoinAndSelect` thanh `leftJoin` + raw select.
- Doi `getManyAndCount()` thanh `getRawMany()`.
- Loai bo count query khong su dung.

**Tac dong / Ly do toi uu**:
- Giam CPU DB do bo count query thua.
- Tranh hydrate entity (ton RAM/CPU) khi chi can list fields.
- Giam response time va memory usage khi dataset lon.

**Rui ro / Tac dong phu**:
- Raw result khong tu dong parse type (can Number(...) cho decimal).

**Goi y kiem thu**:
- So sanh output list truoc/sau (price, measure_unit_name).
- Test voi limit/offset khac nhau.

---

## 6) Toi uu search slug: bo subquery moi dong va bo count khong dung

**Vi tri**: MedicineService.searchBySlug() trong src/modules/medicine/medicine.service.ts

**Cu (hien tai)**
```ts
const query = this.medicineRepository
  .createQueryBuilder('m')
  .select([
    'm.id',
    'm.slug',
    'm.name',
    'm.image_url',
    'm.product_type',
  ])
  .addSelect(
    (subquery) =>
      subquery
        .select('p.price')
        .from(MedicinePrice, 'p')
        .where('p.product_id = m.id')
        .andWhere('p.is_sell_default = :default', { default: true })
        .limit(1),
    'm_default_price',
  )
  .addSelect(
    (subquery) =>
      subquery
        .select('mu.name')
        .from(MedicinePrice, 'p')
        .innerJoin(MeasureUnit, 'mu', 'mu.id = p.measure_unit_id')
        .where('p.product_id = m.id')
        .andWhere('p.is_sell_default = :default', { default: true })
        .limit(1),
    'm_default_measure_name',
  )
  .addSelect(
    `CASE 
      WHEN m.slug = :exactSlug THEN '${SearchMatchType.EXACT}'
      WHEN m.slug LIKE :slugPattern THEN '${SearchMatchType.PREFIX}'
      ELSE '${SearchMatchType.PARTIAL}'
    END`,
    'm_match_type',
  )
  .where('m.slug LIKE :slugPattern', { slugPattern })
  .andWhere('m.is_active = :active', { active: true })
  .andWhere('m.deleted_at IS NULL')
  .orderBy(
    `CASE 
      WHEN m.slug = :exactSlug THEN 0
      ELSE 1
    END`,
    'ASC',
  )
  .addOrderBy('m.created_at', 'DESC')
  .skip(skip)
  .take(limit)
  .setParameter('exactSlug', slugPrefix)
  .setParameter('slugPattern', slugPattern)
  .setParameter('active', true)
  .setParameter('default', true);

const [medicines, total] = await query.getManyAndCount();

return medicines.map((m: any) => ({
  id: m.id,
  slug: m.slug,
  name: m.name,
  image_url: m.image_url,
  product_type: m.product_type,
  price: m.m_default_price || 0,
  measure_unit_name: m.m_default_measure_name || '',
  is_sell_default: true,
  match_type: m.m_match_type as SearchMatchType,
}));
```

**Moi (de xuat)**
```ts
const query = this.medicineRepository
  .createQueryBuilder('m')
  .leftJoin('m.prices', 'p', 'p.is_sell_default = :default', { default: true })
  .leftJoin('p.measure_unit', 'mu')
  .select('m.id', 'id')
  .addSelect('m.slug', 'slug')
  .addSelect('m.name', 'name')
  .addSelect('m.image_url', 'image_url')
  .addSelect('m.product_type', 'product_type')
  .addSelect('p.price', 'price')
  .addSelect('mu.name', 'measure_unit_name')
  .addSelect(
    `CASE 
      WHEN m.slug = :exactSlug THEN '${SearchMatchType.EXACT}'
      WHEN m.slug LIKE :slugPattern THEN '${SearchMatchType.PREFIX}'
      ELSE '${SearchMatchType.PARTIAL}'
    END`,
    'match_type',
  )
  .where('m.slug LIKE :slugPattern', { slugPattern })
  .andWhere('m.is_active = :active', { active: true })
  .andWhere('m.deleted_at IS NULL')
  .orderBy(
    `CASE 
      WHEN m.slug = :exactSlug THEN 0
      ELSE 1
    END`,
    'ASC',
  )
  .addOrderBy('m.created_at', 'DESC')
  .skip(skip)
  .take(limit)
  .setParameter('exactSlug', slugPrefix)
  .setParameter('slugPattern', slugPattern)
  .setParameter('active', true)
  .setParameter('default', true);

const rows = await query.getRawMany();

return rows.map((row: any) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  image_url: row.image_url,
  product_type: row.product_type,
  price: row.price ? Number(row.price) : 0,
  measure_unit_name: row.measure_unit_name ?? '',
  is_sell_default: true,
  match_type: row.match_type as SearchMatchType,
}));
```

**Chi tiet thay doi (what/how)**:
- Doi subquery theo tung dong (default price + unit name) thanh join.
- Dung raw select de lay dung cac field can thiet.
- Bo count query khong dung bang cach dung `getRawMany()`.

**Tac dong / Ly do toi uu**:
- Khong con chay subquery cho moi row (giam CPU ro ret khi dataset lon).
- Query plan don gian hon, de tan dung index.
- Giam latency cho search slug khi traffic cao.

**Rui ro / Tac dong phu**:
- Neu mot product co nhieu default price (data sai), join co the ra nhieu row.
- Can dam bao chi co 1 price default / product.

**Goi y kiem thu**:
- Search slug exact, prefix, partial de kiem tra thu tu sap xep.
- So sanh ket qua price, measure_unit_name truoc/sau.

---

## Ghi chu ve pham vi
- Tai lieu nay chi mo ta de xuat toi uu, khong thay doi code thuc te.
- Neu can trien khai, toi se tao PR hoac apply thay doi theo dung cac muc tren.
