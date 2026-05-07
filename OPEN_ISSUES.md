# Open Issues

Date: 2026-04-19
Project: PBL7 Backend (NestJS)

## Critical / High

### 1) Missing authorization on order endpoints
- File: src/modules/order/order.controller.ts
- Current state: all endpoints are public (no JwtGuard/AdminGuard)
- Risk: unauthorized users can read/update/delete orders or checkout for arbitrary user IDs
- Recommended fix:
  - Add JwtGuard for user-scoped routes
  - Add ownership validation (user can only access own orders)
  - Add AdminGuard for admin-only operations (findAll, update, remove if admin-only by business rules)

### 2) Missing authorization on payment endpoints
- File: src/modules/payment/payment.controller.ts
- Current state: all endpoints are public (no JwtGuard/AdminGuard)
- Risk: unauthorized users can view/update/process payments
- Recommended fix:
  - Add JwtGuard to all payment endpoints
  - Add ownership/admin checks for order-linked payment access
  - Restrict process payment endpoint to authorized user or service role

## Medium

### 3) Category service still uses Promise<any>
- File: src/modules/category/category.service.ts
- Methods:
  - findBySlug(slug: string): Promise<any>
  - findProductsBySlug(...): Promise<any>
- Risk: weak type safety and unstable API contracts
- Recommended fix:
  - Replace with explicit DTOs (CategoryDetailDto, CategoryProductsResponseDto)
  - Remove remaining any fields and map concrete response interfaces

### 4) Category products query can be optimized
- File: src/modules/category/category.service.ts
- Current state: multiple queries (count + products + prices merge)
- Risk: performance degradation on larger datasets
- Recommended fix:
  - Use a single optimized query builder with joins where possible
  - Consider precomputed view/index strategy if traffic is high

### 5) No CORS/security headers in bootstrap
- File: src/main.ts
- Current state: no enableCors and no helmet middleware
- Risk: weaker HTTP security defaults and potential frontend integration issues
- Recommended fix:
  - Enable CORS with explicit allowed origins
  - Add helmet middleware and review CSP policy

## Low

### 6) Test script mismatch for unit tests
- Files:
  - package.json
  - test/app.e2e-spec.ts
- Current state:
  - npm test looks for *.spec.ts under src rootDir
  - currently no unit spec in src, so npm test returns "No tests found"
- Recommended fix:
  - Add unit tests under src/**/*.spec.ts
  - Or adjust scripts to use --passWithNoTests for CI until tests are added
  - Keep e2e tests under test/ and run with npm run test:e2e

## Verification Snapshot
- Source diagnostics: no compile/language-service errors currently reported
- Build: successful
- Unit test command: no matching unit test files found under current config

## Suggested Implementation Order
1. Add guards + ownership checks for order/payment controllers
2. Replace Promise<any> in category service with typed DTO responses
3. Optimize category product listing query
4. Add CORS + helmet in main bootstrap
5. Normalize test strategy (unit + e2e)
