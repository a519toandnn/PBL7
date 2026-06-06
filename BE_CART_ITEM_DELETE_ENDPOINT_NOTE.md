# De xuat BE: xoa cart item theo cart_item_id

## Van de hien tai

FE da sync cart voi BE bang cac API e-commerce:

- `GET /cart`
- `POST /cart/add`
- `DELETE /cart/item/:productId/unit/:measureUnitId`
- `DELETE /cart/clear`

Khi user checkout mot so item trong cart, FE can xoa cac item da checkout khoi cart. Hien tai FE phai xoa bang:

```txt
DELETE /cart/item/:productId/unit/:measureUnitId
```

Trong khi response `GET /cart` da tra ve san `cart_item_id`.

Vi vay FE se don gian va ro nghia hon neu co endpoint user-facing de xoa truc tiep theo `cart_item_id`.

## Hien trang BE

Trong `cart.controller.ts`, endpoint xoa cart item cho user hien tai dang la:

```ts
@Delete('item/:productId/unit/:measureUnitId')
@UseGuards(JwtGuard)
removeItemFromCart(
  @Request() req: any,
  @Param('productId') productId: string,
  @Param('measureUnitId') measureUnitId: string,
) {
  return this.cartService.removeItemFromCart(req.user.userId, +productId, +measureUnitId);
}
```

Trong `cartitem.controller.ts` co endpoint:

```ts
@Delete(':id')
remove(@Param('id') id: string) {
  return this.cartitemService.remove(+id);
}
```

Nhung controller nay dang co guard:

```ts
@UseGuards(JwtGuard, AdminGuard)
```

Nen `DELETE /cartitem/:id` chi phu hop cho admin, user thuong khong dung duoc.

## Vi sao endpoint hien tai co the duoc thiet ke nhu vay

Entity `CartItem` dang co unique constraint:

```ts
@Unique(['cart', 'product', 'measure_unit'])
```

Nghia la trong cart cua mot user, mot dong cart item duoc dinh danh tu nhien bang:

```txt
cart + product + measure_unit
```

Viec xoa theo `productId + measureUnitId` co uu diem la service co the tu lay cart cua user hien tai bang JWT, roi chi xoa item nam trong cart do.

Tuy nhien voi FE, khi da co `cart_item_id` tu `GET /cart`, viec phai gui lai `productId + measureUnitId` lam code dai hon va de sai hon.

## De xuat endpoint moi

Them endpoint user-facing:

```txt
DELETE /cart/item/:cartItemId
```

Hoac neu muon tranh conflict path voi endpoint cu:

```txt
DELETE /cart/item/id/:cartItemId
```

Endpoint nay van phai dung `JwtGuard`.

## Logic service de xuat

Service khong nen xoa cart item chi bang `id`, vi user co the gui nham hoac co tinh gui `cart_item_id` cua user khac.

Nen query kem ownership theo user hien tai:

```ts
async removeItemFromCartById(userId: number, cartItemId: number) {
  const cart = await this.getOrCreateCartByUserId(userId);

  const cartItem = await this.cartItemRepository.findOne({
    where: {
      id: cartItemId,
      cart: { id: cart.id },
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
```

Controller:

```ts
@Delete('item/:cartItemId')
@UseGuards(JwtGuard)
removeItemFromCartById(
  @Request() req: any,
  @Param('cartItemId', ParseIntPipe) cartItemId: number,
) {
  return this.cartService.removeItemFromCartById(req.user.userId, cartItemId);
}
```

## Loi ich

- FE checkout xong co the xoa item da mua bang chinh `cart_item_id` tu `GET /cart`.
- Payload/URL ngan hon, ro nghia hon.
- Khong can FE giu logic `productId + measureUnitId` de xoa.
- Van dam bao bao mat neu BE check `cartItem.cart.id === currentUser.cart.id`.
- Endpoint cu `DELETE /cart/item/:productId/unit/:measureUnitId` co the giu lai de backward compatibility.

## Luu y them

Hien tai `POST /order/checkout` tao order tu `cart_item_ids`, nhung trong `OrderService.createOrderFromCart` chua thay logic xoa cac cart item da checkout sau khi tao order.

Neu BE muon lam dung hon, co the xoa selected cart items ngay trong transaction checkout. Khi do FE chi can:

```txt
POST /order/checkout
```

Va khong can goi them API xoa cart item sau checkout nua.

Day co le la phuong an sach nhat ve mat domain: checkout thanh cong thi BE tu chuyen selected cart items thanh order items va remove chung khoi cart trong cung transaction.
