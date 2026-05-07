# API Full Documentation - PBL7 Backend

Updated: 2026-04-19

## 1. Overview

- Framework: NestJS
- Default port: `3000` (from `process.env.PORT ?? 3000`)
- Global validation:
  - whitelist: true
  - forbidNonWhitelisted: true
  - transform: true
- Global response wrapper: enabled via `ApiResponseInterceptor`
- Global exception handling: enabled via `GlobalExceptionFilter`

## 2. Standard Response Format

### 2.1 Success Envelope
All successful responses are wrapped in this format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2026-04-19T12:00:00.000Z",
  "traceId": "2f5f4031-7bd3-4f35-b422-e8cd1f7d4e26"
}
```

### 2.2 Error Envelope
All errors are wrapped in this format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email",
      "code": 1007
    }
  ],
  "timestamp": "2026-04-19T12:00:00.000Z",
  "traceId": "fdfadf9b-bcb0-4b2e-a2e2-541219640d4f"
}
```

### 2.3 Common Headers
- `Content-Type: application/json`
- For protected endpoints:
  - `Authorization: Bearer <access_token>`

## 3. Authentication and Roles

### 3.1 JWT Payload
JWT payload returned by login:

```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "CUSTOMER"
}
```

### 3.2 Roles
- `CUSTOMER`
- `ADMIN`

### 3.3 Guards Used in Source
- `JwtGuard`: requires valid JWT token
- `AdminGuard`: requires role `ADMIN`

## 4. Health and Root APIs

## 4.1 GET /
Return welcome message.

### Request
- Path params: none
- Query params: none
- Body: none

### Data response
```json
"Welcome to Medicine E-Commerce API"
```

## 4.2 GET /health
Return server health info.

### Request
- Path params: none
- Query params: none
- Body: none

### Data response
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2026-04-19T12:00:00.000Z"
}
```

## 5. Auth Module

Base path: `/auth`

## 5.1 POST /auth/login
User login and receive JWT.

### Access
- Public

### Request body
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

### Validation rules
- `email`: required, email format
- `password`: required, string, min length 6

### Data response
```json
{
  "access_token": "<jwt_token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Nguyen Van A",
    "phone": "0909123456",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  }
}
```

## 6. User Module

Base path: `/user`

## 6.1 POST /user
Register new user.

### Access
- Public

### Request body
```json
{
  "full_name": "Nguyen Van A",
  "email": "user@example.com",
  "password": "Password123",
  "phone": "0909123456"
}
```

### Validation rules
- `full_name`: required, string, min length 2
- `email`: required, email format
- `password`: required, string, min length 8, must contain lowercase + uppercase + number
- `phone`: optional, string

### Data response
Returns created `User` entity (without `password_hash` due to class serializer):

```json
{
  "id": 1,
  "full_name": "Nguyen Van A",
  "email": "user@example.com",
  "phone": "0909123456",
  "role": "CUSTOMER",
  "status": "ACTIVE",
  "created_at": "2026-04-19T12:00:00.000Z",
  "updated_at": "2026-04-19T12:00:00.000Z"
}
```

## 6.2 GET /user
Get all users.

### Access
- Protected: `JwtGuard + AdminGuard`

### Request
- No body
- No query params

### Data response
Array of users.

## 6.3 GET /user/profile
Get current user profile.

### Access
- Protected: `JwtGuard`

### Data response
User with relations loaded: `orders`, `cart`, `addresses`.

## 6.4 GET /user/:id
Get user by id.

### Access
- Protected: `JwtGuard + AdminGuard`

### Path params
- `id`: integer

### Data response
User with relations loaded: `orders`, `cart`, `addresses`.

## 6.5 PATCH /user/profile
Update current profile.

### Access
- Protected: `JwtGuard`

### Request body
```json
{
  "full_name": "Nguyen Van B",
  "email": "new@example.com",
  "password": "Newpass123",
  "old_password": "Oldpass123",
  "phone": "0911222333"
}
```

### Notes
- In profile update, only these fields are accepted by controller: `full_name`, `email`, `password`, `old_password`, `phone`.
- `role` and `status` are intentionally ignored in this endpoint.
- If `password` is provided, `old_password` is required and must match current password.

### Data response
Updated user entity.

## 6.6 PATCH /user/:id
Update any user by id.

### Access
- Protected: `JwtGuard + AdminGuard`

### Path params
- `id`: integer

### Request body
```json
{
  "full_name": "Admin Updated Name",
  "email": "admin.updated@example.com",
  "phone": "0909000111",
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

### Validation rules
- Same as `UpdateUserDto`
- `role`: enum `CUSTOMER | ADMIN`
- `status`: enum `ACTIVE | LOCKED | DELETED`

### Data response
Updated user entity.

## 6.7 DELETE /user/:id
Delete user by id.

### Access
- Protected: `JwtGuard + AdminGuard`

### Path params
- `id`: integer

### Data response
Service returns `void`; response wrapper data is typically `null`.

## 7. User Address Module

Base path: `/user/addresses`

## 7.1 POST /user/addresses
Create address for current user.

### Access
- Protected: `JwtGuard`

### Request body
```json
{
  "receiver_name": "Nguyen Van A",
  "receiver_phone": "0909123456",
  "address_line": "123 Le Loi, District 1",
  "ward": "Ben Nghe",
  "province": "Ho Chi Minh",
  "is_default": true
}
```

### Validation rules
- `receiver_name`: required, string, min length 2
- `receiver_phone`: required, string, min length 10
- `address_line`: required, string, min length 10
- `ward`: optional string
- `province`: optional string
- `is_default`: optional boolean

### Data response
Created `UserAddress`:

```json
{
  "id": 1,
  "receiver_name": "Nguyen Van A",
  "receiver_phone": "0909123456",
  "address_line": "123 Le Loi, District 1",
  "ward": "Ben Nghe",
  "province": "Ho Chi Minh",
  "is_default": true,
  "updated_at": "2026-04-19T12:00:00.000Z"
}
```

## 7.2 GET /user/addresses/list
List all addresses of current user.

### Access
- Protected: `JwtGuard`

### Data response
Array of `UserAddress`.

## 7.3 GET /user/addresses/:addressId
Get one address of current user.

### Access
- Protected: `JwtGuard`

### Path params
- `addressId`: numeric string (manual regex checked)

### Data response
Single `UserAddress`.

## 7.4 PATCH /user/addresses/:addressId
Update one address of current user.

### Access
- Protected: `JwtGuard`

### Path params
- `addressId`: numeric string (manual regex checked)

### Request body
Same structure as `UpdateUserAddressDto`:

```json
{
  "receiver_name": "Nguyen Van C",
  "receiver_phone": "0911888999",
  "address_line": "456 Tran Hung Dao",
  "ward": "Ward 2",
  "province": "Ho Chi Minh",
  "is_default": false
}
```

### Data response
Updated `UserAddress`.

## 7.5 DELETE /user/addresses/:addressId
Delete one address of current user.

### Access
- Protected: `JwtGuard`

### Path params
- `addressId`: numeric string (manual regex checked)

### Data response
`null` (service returns void).

## 8. Category Module

Base path: `/category`

## 8.1 POST /category
Create category.

### Access
- Protected: `JwtGuard + AdminGuard`

### Request body
```json
{
  "name": "Thuoc",
  "slug": "thuoc",
  "parent_id": 1,
  "level": 2,
  "is_active": true
}
```

### Validation rules
- `name`: required string
- `slug`: required string
- `parent_id`: optional number
- `level`: optional number, min 1
- `is_active`: optional boolean

### Data response
Created `Category` entity.

## 8.2 GET /category
Get root active categories.

### Access
- Public

### Data response
Array of categories where `level = 1` and `is_active = true`, with `children` relation.

## 8.3 GET /category/:slug/products
Get paginated products by category slug.

### Access
- Public

### Path params
- `slug`: category slug

### Query params
- `page`: integer, default 1, must be >= 1
- `limit`: integer, default 20, must be >= 1, max capped at 100

### Data response
```json
{
  "data": [
    {
      "id": 101,
      "name": "Paracetamol 500",
      "slug": "paracetamol-500",
      "image_url": "https://...",
      "price": "12000.00",
      "measure_unit_name": "vien",
      "is_sell_default": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 52,
    "totalPages": 3
  }
}
```

## 8.4 GET /category/:idOrSlug
Get category by numeric id or slug.

### Access
- Public

### Behavior
- If `idOrSlug` parses to integer => returns `findById`
- Else => returns smart slug response (`subcategories` or `products` hint)

### Smart slug data response example
```json
{
  "type": "subcategories",
  "id": 2,
  "name": "Thuoc",
  "slug": "thuoc",
  "level": 1,
  "categories": [
    {
      "id": 3,
      "name": "Thuoc ho hap",
      "slug": "thuoc-ho-hap"
    }
  ]
}
```

Or:

```json
{
  "type": "products",
  "id": 7,
  "name": "Thuoc da lieu",
  "slug": "thuoc-da-lieu",
  "level": 2,
  "message": "Use GET /category/:slug/products for paginated product list"
}
```

## 8.5 PATCH /category/:id
Update category.

### Access
- Protected: `JwtGuard + AdminGuard`

### Path params
- `id`: integer

### Request body
`UpdateCategoryDto` (all fields optional from create DTO)

### Data response
Updated `Category` entity.

## 8.6 DELETE /category/:id
Delete category.

### Access
- Protected: `JwtGuard + AdminGuard`

### Path params
- `id`: integer

### Data response
`null` (service returns void).

## 9. Medicine Module

Base path: `/medicines`

## 9.1 GET /medicines
Get paginated medicine listing.

### Access
- Public

### Query params
- `page`: integer, default 1, must be >= 1
- `limit`: integer, default 20, must be >= 1, max capped at 100

### Data response
Array of `MedicineListItemDto`:

```json
[
  {
    "id": 101,
    "slug": "paracetamol-500",
    "name": "Paracetamol 500",
    "image_url": "https://...",
    "product_type": "DRUG",
    "price": 12000,
    "measure_unit_name": "vien",
    "is_sell_default": true
  }
]
```

## 9.2 GET /medicines/search
Search medicine by slug prefix.

### Access
- Public

### Query params
- `q`: search text (slug prefix)
- `page`: integer, default 1, must be >= 1
- `limit`: integer, default 10, must be >= 1, max capped at 50

### Data response
Array of `MedicineSearchItemDto`:

```json
[
  {
    "id": 101,
    "slug": "paracetamol-500",
    "name": "Paracetamol 500",
    "image_url": "https://...",
    "product_type": "DRUG",
    "price": 12000,
    "measure_unit_name": "vien",
    "is_sell_default": true,
    "match_type": "prefix"
  }
]
```

## 9.3 GET /medicines/:slug
Get medicine detail by slug.

### Access
- Public

### Data response
`MedicineDetailDto`:

```json
{
  "id": 101,
  "name": "Paracetamol 500",
  "slug": "paracetamol-500",
  "product_type": "DRUG",
  "description": "...",
  "image_url": "https://...",
  "is_active": true,
  "created_at": "2026-04-19T12:00:00.000Z",
  "updated_at": "2026-04-19T12:00:00.000Z",
  "medical_info": {
    "usage": "...",
    "dosage": "...",
    "adverse_effect": "...",
    "careful": "...",
    "preservation": "..."
  },
  "prices": [
    {
      "price": 12000,
      "measure_id": 1,
      "measure_name": "vien",
      "is_sell_default": true
    }
  ],
  "categories": [
    {
      "id": 2,
      "name": "Thuoc",
      "slug": "thuoc",
      "is_primary": true
    }
  ]
}
```

## 9.4 POST /medicines
Create medicine.

### Access
- Protected: `JwtGuard + AdminGuard`

### Request body
```json
{
  "name": "Paracetamol 500",
  "slug": "paracetamol-500",
  "product_type": "DRUG",
  "description": "...",
  "image_url": "https://...",
  "is_active": true,
  "category_ids": [2, 7],
  "prices": [
    {
      "measure_unit_id": 1,
      "price": 12000,
      "is_sell_default": true
    }
  ],
  "medical_info": {
    "usage": "...",
    "dosage": "...",
    "adverse_effect": "...",
    "careful": "...",
    "preservation": "..."
  }
}
```

### Validation highlights
- `name`, `slug`: required strings
- `product_type`: optional enum `DRUG | SUPPLEMENT | OTHER`
- `category_ids`: optional number[]
- `prices[].price`: number, min 0
- only one `is_sell_default=true` allowed in business logic

### Data response
Created medicine entity with relations.

## 9.5 PATCH /medicines/:id
Update medicine.

### Access
- Protected: `JwtGuard + AdminGuard`

### Path params
- `id`: integer

### Request body
`UpdateMedicineDto` (partial of create DTO)

### Data response
Updated medicine entity with relations.

## 9.6 DELETE /medicines/:id
Soft delete medicine.

### Access
- Protected: `JwtGuard + AdminGuard`

### Path params
- `id`: integer

### Data response
`null` (service returns void).

## 10. Cart Module

Base path: `/cart`

## 10.1 POST /cart
Create cart by user id.

### Access
- Public in current source

### Request body
```json
{
  "user_id": 1
}
```

### Data response
Created `Cart` entity.

## 10.2 GET /cart
Get all carts.

### Access
- Public in current source

### Data response
Array of carts with relations: `user`, `items`, `items.product`, `items.measure_unit`.

## 10.3 GET /cart/user/:userId
Get cart summary by user id.

### Access
- Public in current source

### Path params
- `userId`: numeric string

### Data response
```json
{
  "cart_id": 10,
  "user_id": 1,
  "items": [
    {
      "cart_item_id": 55,
      "product_id": 101,
      "product_name": "Paracetamol 500",
      "measure_unit_id": 1,
      "measure_unit_name": "vien",
      "unit_price": 12000,
      "quantity": 2,
      "subtotal": 24000
    }
  ],
  "total_items": 1,
  "total_price": 24000
}
```

## 10.4 GET /cart/:id
Get cart by id.

### Access
- Public in current source

### Path params
- `id`: numeric string

### Data response
Cart with relations.

## 10.5 PATCH /cart/:id
Update cart.

### Access
- Public in current source

### Request body
`UpdateCartDto` (partial):

```json
{
  "user_id": 2
}
```

### Data response
Updated cart entity.

## 10.6 DELETE /cart/:id
Delete cart.

### Access
- Public in current source

### Data response
`null` (service returns void).

## 10.7 POST /cart/user/:userId/add-item
Add item to cart.

### Access
- Public in current source

### Path params
- `userId`: numeric string

### Request body
```json
{
  "product_id": 101,
  "measure_unit_id": 1,
  "quantity": 2
}
```

### Validation rules
- all fields required
- all fields numeric, min 1

### Data response
Full updated cart with relations.

## 10.8 DELETE /cart/user/:userId/item/:productId/unit/:measureUnitId
Remove one item from cart.

### Access
- Public in current source

### Data response
Full updated cart with relations.

## 10.9 DELETE /cart/user/:userId/clear
Clear entire cart.

### Access
- Public in current source

### Data response
`null` (service returns void).

## 11. CartItem Module

Base path: `/cartitem`

## 11.1 POST /cartitem
Create cart item directly.

### Access
- Public in current source

### Request body
```json
{
  "quantity": 2,
  "cart_id": 10,
  "product_id": 101,
  "measure_unit_id": 1
}
```

### Data response
Created `CartItem` with relations.

## 11.2 GET /cartitem
List all cart items.

### Data response
Array of `CartItem` with relations `cart`, `product`, `measure_unit`.

## 11.3 GET /cartitem/:id
Get cart item by id.

### Data response
Single `CartItem`.

## 11.4 PATCH /cartitem/:id
Update cart item.

### Request body
`UpdateCartitemDto` (partial)

### Data response
Updated `CartItem`.

## 11.5 DELETE /cartitem/:id
Delete cart item.

### Data response
`null`.

## 12. Order Module

Base path: `/order`

## 12.1 POST /order
Create order directly from input items.

### Access
- Public in current source

### Request body
```json
{
  "user_id": 1,
  "note": "Giao buoi sang",
  "status": "PENDING",
  "items": [
    {
      "product_id": 101,
      "measure_unit_id": 1,
      "quantity": 2
    }
  ]
}
```

### Validation rules
- `user_id`: required number
- `note`: optional string
- `status`: optional enum `PENDING | PAID | CANCELLED`
- `items`: required array, min 1
- `items[].quantity`: number, min 1

### Data response
Full `Order` with relations: `user`, `items`, `items.product`, `payments`, `payments.payment_method`.

## 12.2 GET /order
Get all orders.

### Access
- Public in current source

### Data response
Array of full orders with relations.

## 12.3 GET /order/user/:userId
Get all orders by user id.

### Access
- Public in current source

### Path params
- `userId`: integer (`ParseIntPipe`)

### Data response
Array of orders (or empty array).

## 12.4 GET /order/:id/details
Get flattened order detail summary.

### Access
- Public in current source

### Path params
- `id`: integer

### Data response
```json
{
  "order_id": 20,
  "order_no": "ORD-123456789",
  "user_id": 1,
  "user_name": "Nguyen Van A",
  "status": "PENDING",
  "note": "...",
  "total_amount": 24000,
  "created_at": "2026-04-19T12:00:00.000Z",
  "items": [
    {
      "order_item_id": 1,
      "product_id": 101,
      "product_name": "Paracetamol 500",
      "unit_name": "vien",
      "unit_price": 12000,
      "quantity": 2,
      "subtotal": 24000
    }
  ]
}
```

## 12.5 GET /order/:id
Get order by id.

### Access
- Public in current source

### Data response
Full order with relations.

## 12.6 PATCH /order/:id
Update order.

### Access
- Public in current source

### Request body
`UpdateOrderDto` (partial of create order DTO)

### Data response
Updated full order.

## 12.7 DELETE /order/:id
Delete order.

### Access
- Public in current source

### Data response
`null`.

## 12.8 POST /order/user/:userId/checkout
Create order from current user cart.

### Access
- Public in current source

### Path params
- `userId`: integer

### Request body
```json
{
  "note": "Giao gio hanh chinh"
}
```

### Data response
Full order with relations.

## 13. OrderItem Module

Base path: `/orderitem`

## 13.1 POST /orderitem
Create order item directly.

### Access
- Public in current source

### Request body
```json
{
  "quantity": 2,
  "unit_price": 12000,
  "line_total": 24000,
  "order_id": 20,
  "product_id": 101
}
```

### Data response
Created `OrderItem`.

## 13.2 GET /orderitem
List all order items.

### Data response
Array of `OrderItem` with `order`, `product` relations.

## 13.3 GET /orderitem/:id
Get order item by id.

### Data response
Single `OrderItem`.

## 13.4 PATCH /orderitem/:id
Update order item.

### Request body
`UpdateOrderitemDto` (partial)

### Data response
Updated `OrderItem`.

## 13.5 DELETE /orderitem/:id
Delete order item.

### Data response
`null`.

## 14. Payment Module

Base path: `/payment`

## 14.1 POST /payment
Create payment transaction.

### Access
- Public in current source

### Request body
```json
{
  "order_id": 20,
  "payment_method_code": "COD",
  "amount": 24000,
  "status": "PENDING",
  "provider_txn_id": "TXN-001"
}
```

### Validation rules
- `order_id`: required number
- `payment_method_code`: required string
- `amount`: optional number
- `status`: optional enum `PENDING | SUCCESS | FAILED`
- `provider_txn_id`: optional string

### Data response
Created `Payment` entity.

## 14.2 GET /payment
Get all payments.

### Access
- Public in current source

### Data response
Array of `Payment` with relations `order`, `payment_method`.

## 14.3 GET /payment/order/:orderId
Get payment list by order id.

### Access
- Public in current source

### Path params
- `orderId`: integer

### Data response
Array of `Payment`.

## 14.4 GET /payment/:id/details
Get flattened payment details.

### Access
- Public in current source

### Path params
- `id`: integer

### Data response
```json
{
  "payment_id": 99,
  "order_id": 20,
  "payment_method_code": "COD",
  "payment_method_name": "COD",
  "payment_status": "SUCCESS",
  "amount": 24000,
  "provider_txn_id": null,
  "paid_at": "2026-04-19T12:00:00.000Z",
  "created_at": "2026-04-19T12:00:00.000Z"
}
```

## 14.5 GET /payment/:id
Get payment by id.

### Access
- Public in current source

### Data response
Single `Payment`.

## 14.6 PATCH /payment/:id
Update payment.

### Access
- Public in current source

### Request body
`UpdatePaymentDto` (partial)

### Data response
Updated `Payment`.

## 14.7 DELETE /payment/:id
Delete payment.

### Access
- Public in current source

### Data response
`null`.

## 14.8 POST /payment/order/:orderId/process
Process payment for an order.

### Access
- Public in current source

### Path params
- `orderId`: integer

### Request body
```json
{
  "payment_method_code": "COD"
}
```

### Business flow (transactional)
- start DB transaction
- create payment with `PENDING`
- update payment to `SUCCESS` and set `paid_at`
- update order status to `PAID`
- clear user cart items if available
- commit transaction

### Data response
```json
{
  "payment": {
    "id": 99,
    "amount": 24000,
    "status": "SUCCESS",
    "provider_txn_id": null,
    "paid_at": "2026-04-19T12:00:00.000Z"
  },
  "message": "Payment successful. Your order has been confirmed and cart has been cleared."
}
```

## 15. Notes for Frontend Integration

- Always parse `data` from the top-level response wrapper.
- Handle both `success=true` and `success=false` envelope uniformly.
- For protected endpoints, store and send JWT in `Authorization` header.
- Some modules are currently public in source (`cart`, `cartitem`, `order`, `orderitem`, `payment`). If deployed to production, add guards/ownership checks before exposing publicly.

## 16. Quick Validation Error Example

Example invalid request to `POST /user`:

### Request body
```json
{
  "full_name": "A",
  "email": "not-an-email",
  "password": "123"
}
```

### Error response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "message": "full_name must be longer than or equal to 2 characters",
      "code": 1007
    },
    {
      "message": "email must be an email",
      "code": 1007
    },
    {
      "message": "password must be longer than or equal to 8 characters, Password must contain at least one lowercase letter, one uppercase letter, and one number",
      "code": 1007
    }
  ],
  "timestamp": "2026-04-19T12:00:00.000Z",
  "traceId": "d473fbb0-c712-4f13-8905-1188cab0e7ac"
}
```
