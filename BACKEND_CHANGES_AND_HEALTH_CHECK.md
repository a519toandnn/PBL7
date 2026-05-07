# Backend Changes And Health Check

Date: 2026-04-19
Project: PBL7 (NestJS Backend)

## 1. What Was Changed

### Security and Auth
- Standardized JWT config usage in Auth module:
  - `src/configs/jwt.config.ts`
  - `src/modules/auth/auth.module.ts`
- Fixed typo in JWT expires env key:
  - from `JWT_EXPRIRES_IN` to `JWT_EXPIRES_IN`
- Removed insecure hardcoded secret fallback in auth flow:
  - `src/modules/auth/auth.module.ts`
  - `src/modules/auth/strategies/jwt.strategy.ts`
- Added admin authorization guard:
  - `src/modules/auth/guards/admin.guard.ts`

### Access Control
- Protected admin-only user management endpoints with `JwtGuard + AdminGuard`:
  - `src/modules/user/user.controller.ts`
- Protected write endpoints for medicine:
  - `src/modules/medicine/medicine.controller.ts`
- Protected write endpoints for category:
  - `src/modules/category/category.controller.ts`
- Prevented profile endpoint privilege escalation by filtering allowed fields:
  - `src/modules/user/user.controller.ts`

### Data Consistency and Transactions
- Refactored payment processing into transaction flow (`QueryRunner`) to ensure atomicity:
  - `src/modules/payment/payment.service.ts`
- Cleaned payment module entity registration to remove unused cart entity injection:
  - `src/modules/payment/payment.module.ts`

### Validation and Input Handling
- Added stronger password policy:
  - minimum length 8
  - required lowercase + uppercase + number
  - files:
    - `src/modules/user/dto/create-user.dto.ts`
    - `src/modules/user/dto/update-user.dto.ts`
- Added nested DTO validation for order item list:
  - `src/modules/order/dto/create-order.dto.ts`
- Added `ParseIntPipe` and stricter query/param checks in controllers:
  - `src/modules/order/order.controller.ts`
  - `src/modules/payment/payment.controller.ts`
  - `src/modules/category/category.controller.ts`
  - `src/modules/medicine/medicine.controller.ts`

### Logic and Service Improvements
- Added unique email check in user update flow:
  - `src/modules/user/user.service.ts`
- Refactored cart user validation to shared helper and fixed nullable user compile issue:
  - `src/modules/cart/cart.service.ts`

### Cleanup (Dead Code / Unused Parts)
- Removed unused import:
  - `src/configs/typeorm.config.ts`
- Removed unused `Index` import:
  - `src/modules/cart/entities/cart.entity.ts`
- Removed unused category module registration:
  - `src/modules/category/category.module.ts`
- Removed dead code from slug utility:
  - `src/common/utils/slug.ts`
- Removed unused auth payload DTO file:
  - `src/modules/auth/dto/jwt-payload.dto.ts`
- Removed dead `validateToken` method:
  - `src/modules/auth/auth.service.ts`

## 2. Health Check Results

### Static Error Check (IDE Problems)
- Command/tool: `get_errors` on whole workspace
- Result: **No errors found**

### Build Check
- Command: `npm.cmd run build`
- Result: **Build succeeded** (`nest build` completed)

### Test Check
- Command: `npm.cmd run test -- --runInBand`
- Result: **Test command ran successfully** (`jest --runInBand` completed)

## 3. Current Status

- Compile status: PASS
- Static diagnostics: PASS
- Test run: PASS
- Main requested updates are documented in this file.
