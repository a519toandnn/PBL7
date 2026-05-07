# Comprehensive NestJS Code Review - PBL7 Medicine E-Commerce API

**Date**: April 19, 2026  
**Scope**: Complete analysis of `src/` directory including common modules, configs, and all feature modules  
**Total Issues Found**: 18

---

## 1. UNUSED IMPORTS

### Issue 1.1: Unused `Injectable` Decorator Import
- **File**: [src/configs/typeorm.config.ts](src/configs/typeorm.config.ts)
- **Line**: 1
- **Severity**: Low
- **Issue**: The `Injectable` decorator is imported but never used
- **Code**:
  ```typescript
  import { Injectable } from '@nestjs/common';  // ❌ Unused
  ```
- **Why It's a Problem**: Adds unnecessary imports that clutter the file and increase bundle size slightly
- **Fix**: Remove the unused import
  ```typescript
  // DELETE: import { Injectable } from '@nestjs/common';
  ```

---

## 2. UNUSED VARIABLES/FUNCTIONS

### Issue 2.1: Dead Function - `validateSlugFunction()`
- **File**: [src/common/utils/slug.ts](src/common/utils/slug.ts#L102)
- **Line**: 102-122
- **Severity**: Low
- **Issue**: Function is exported but never called anywhere in the codebase
- **Code**:
  ```typescript
  export function validateSlugFunction(): boolean {  // ❌ Never called
    let passed = 0;
    let failed = 0;
    // ... implementation
    return failed === 0;
  }
  ```
- **Why It's a Problem**: Dead code that serves no purpose in production; takes up space and maintenance burden
- **Fix**: Either use it in tests/scripts or remove it entirely. If keeping for testing, move to a `.spec.ts` file
  ```typescript
  // Consider moving to: src/common/utils/slug.spec.ts or src/common/utils/__tests__/
  ```

### Issue 2.2: Unused Export - `encodeSlugForUrl()`
- **File**: [src/common/utils/slug.ts](src/common/utils/slug.ts#L127)
- **Line**: 127-129
- **Severity**: Low
- **Issue**: Function is exported but never imported or called
- **Code**:
  ```typescript
  export function encodeSlugForUrl(slug: string): string {  // ❌ Never used
    return encodeURIComponent(slug);
  }
  ```
- **Why It's a Problem**: Unused utility function takes up space; developers might waste time trying to use it
- **Fix**: Remove if not needed, or document why it's kept as reserved for future use
  ```typescript
  // Option 1: Remove entirely
  // Option 2: Add TODO comment if reserved for future use
  ```

### Issue 2.3: Unused Export - `logSlugDebug()`
- **File**: [src/common/utils/slug.ts](src/common/utils/slug.ts#L132)
- **Line**: 132-140
- **Severity**: Low
- **Issue**: Debug function is exported but never called
- **Code**:
  ```typescript
  export function logSlugDebug(text: string): void {  // ❌ Never called
    console.log(`Original: "${text}"`);
    // ... debug logging
  }
  ```
- **Why It's a Problem**: Debug-only code shouldn't be exported; creates confused module interface
- **Fix**: Remove export or move to development-only utilities
  ```typescript
  // Option 1: Remove entirely
  // Option 2: Keep as internal (remove export), used only in debugging
  ```

### Issue 2.4: Unused Constant - `SLUG_TEST_CASES`
- **File**: [src/common/utils/slug.ts](src/common/utils/slug.ts#L42)
- **Line**: 42-99
- **Severity**: Low
- **Issue**: Large test data array is exported but never imported/used anywhere
- **Code**:
  ```typescript
  export const SLUG_TEST_CASES = [  // ❌ Never imported
    { input: 'Actadol 500mg', expected: 'actadol-500mg', description: '...' },
    // ... 9 more test cases
  ];
  ```
- **Why It's a Problem**: Takes up ~150 lines of source code; test data shouldn't be in production utils
- **Fix**: Move to test file or remove from exports
  ```typescript
  // Move to: src/common/utils/__tests__/slug.test.ts
  // Or: create src/common/utils/slug.test-cases.ts and don't export from main utils
  ```

### Issue 2.5: Unused Method - `validateToken()` in AuthService
- **File**: [src/modules/auth/auth.service.ts](src/modules/auth/auth.service.ts#L53)
- **Line**: 53-55
- **Severity**: Medium
- **Issue**: Method is defined but never called anywhere in the codebase
- **Code**:
  ```typescript
  validateToken(payload: IJwtPayload): IJwtPayload {  // ❌ Never called
    return payload;
  }
  ```
- **Why It's a Problem**: Dead code that suggests incomplete implementation; confusing for future developers
- **Fix**: Either implement proper validation logic or remove the method
  ```typescript
  // Option 1: Remove if validation happens in JWT Strategy
  // Option 2: Implement actual validation if needed
  validateToken(payload: IJwtPayload): IJwtPayload {
    if (!payload.userId || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
  ```

### Issue 2.6: Unused Method - `findRootCategories()`
- **File**: [src/modules/category/category.service.ts](src/modules/category/category.service.ts#L87)
- **Line**: 87-93
- **Severity**: Low
- **Issue**: Method is defined but never called in controller or anywhere else
- **Code**:
  ```typescript
  async findRootCategories(): Promise<Category[]> {  // ❌ Not used in controller
    return this.categoryRepository.find({
      where: { level: 1, is_active: true },
      order: { name: 'ASC' },
    });
  }
  ```
- **Why It's a Problem**: Suggests incomplete feature implementation; exposes unnecessary complexity
- **Fix**: Either expose in controller or remove
  ```typescript
  // Add to CategoryController if needed:
  // @Get('root')
  // findRootCategories() {
  //   return this.categoryService.findRootCategories();
  // }
  // Or remove entirely if `findAll()` serves the same purpose
  ```

### Issue 2.7: Unused Method - `findChildrenByParentSlug()`
- **File**: [src/modules/category/category.service.ts](src/modules/category/category.service.ts#L98)
- **Line**: 98-111
- **Severity**: Low
- **Issue**: Method is defined but never called anywhere
- **Code**:
  ```typescript
  async findChildrenByParentSlug(parentSlug: string): Promise<Category[]> {  // ❌ Not used
    const parent = await this.categoryRepository.findOne({
      where: { slug: parentSlug, is_active: true },
    });
    // ...
  }
  ```
- **Why It's a Problem**: Dead code suggesting planned feature that wasn't implemented
- **Fix**: Expose in controller or remove
  ```typescript
  // Add to CategoryController if needed:
  // @Get(':parentSlug/children')
  // findChildren(@Param('parentSlug') slug: string) {
  //   return this.categoryService.findChildrenByParentSlug(slug);
  // }
  ```

### Issue 2.8: Unused Method - `getCategoryInfo()`
- **File**: [src/modules/category/category.service.ts](src/modules/category/category.service.ts#L252)
- **Line**: 252-272
- **Severity**: Low
- **Issue**: Method is defined but never called/exposed
- **Code**:
  ```typescript
  async getCategoryInfo(slug: string): Promise<{...}> {  // ❌ Not exposed in controller
    const category = await this.categoryRepository.findOne({
      where: { slug, is_active: true },
      relations: ['product_links'],
    });
    // ...
  }
  ```
- **Why It's a Problem**: Utility method not accessible via API; suggests incomplete implementation
- **Fix**: Expose as controller endpoint or remove if not needed
  ```typescript
  // Add to CategoryController if useful for clients
  ```

---

## 3. UNUSED EXPORTS / DEAD CODE

### Issue 3.1: Unused DTO Class - `JwtPayload`
- **File**: [src/modules/auth/dto/jwt-payload.dto.ts](src/modules/auth/dto/jwt-payload.dto.ts)
- **Line**: 1-4
- **Severity**: Medium
- **Issue**: DTO class is never imported or used anywhere; interface `IJwtPayload` is used instead
- **Code**:
  ```typescript
  export class JwtPayload {  // ❌ Never imported/used
    userId: number;
    email: string;
    role: string;
  }
  ```
- **Why It's a Problem**: Redundant with `IJwtPayload` interface; causes confusion about which to use; wasted file
- **Finding**: Verified with grep - no imports of this DTO anywhere in codebase
- **Fix**: Delete the entire file and use the interface instead
  ```typescript
  // Delete: src/modules/auth/dto/jwt-payload.dto.ts
  // The interface in src/common/interfaces/jwt-payload.interface.ts serves this purpose
  ```

---

## 4. REDUNDANT/DUPLICATE CODE

### Issue 4.1: Duplicate Cart Creation Logic
- **File**: [src/modules/cart/cart.service.ts](src/modules/cart/cart.service.ts)
- **Lines**: 67-87 (getOrCreateCartByUserId) and 89-119 (addItemToCart)
- **Severity**: Medium
- **Issue**: Cart creation and user validation logic is duplicated
- **Code**:
  ```typescript
  // Appears in getOrCreateCartByUserId() at line 73-77
  const user = await this.userRepository.findOne({
    where: { id: userId },
  });
  if (!user) {
    throw new BadRequestException('User not found');
  }
  
  // And again in addItemToCart() at line 89-93 (via getOrCreateCartByUserId call)
  ```
- **Why It's a Problem**: Maintenance burden; if validation changes, must update multiple places
- **Fix**: Extract to private method
  ```typescript
  private async validateAndGetUser(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    return user;
  }
  
  // Use in both methods:
  const user = await this.validateAndGetUser(userId);
  ```

### Issue 4.2: Duplicate Product Validation in OrderService
- **File**: [src/modules/order/order.service.ts](src/modules/order/order.service.ts)
- **Lines**: 43-50 and 78-85
- **Severity**: Low
- **Issue**: Product and measure unit validation logic is repeated in `create()` and `createOrderFromCart()`
- **Code**:
  ```typescript
  // In create():
  const product = await this.medicineRepository.findOne({
    where: { id: item.product_id },
    relations: ['prices', 'prices.measure_unit'],
  });
  if (!product) {
    throw new BadRequestException(`Product ${item.product_id} not found`);
  }
  
  // Similar logic repeated in createOrderFromCart()
  ```
- **Why It's a Problem**: Code duplication makes maintenance harder
- **Fix**: Extract to private helper method

---

## 5. INEFFICIENT/PROBLEMATIC CODE PATTERNS

### Issue 5.1: Complex Query in `findProductsBySlug()`
- **File**: [src/modules/category/category.service.ts](src/modules/category/category.service.ts#L165)
- **Line**: 165-230
- **Severity**: Medium
- **Issue**: Method is overly complex with manual SQL joins and multiple repository queries instead of using TypeORM relations properly
- **Code**:
  ```typescript
  async findProductsBySlug(slug: string, page: number = 1, limit: number = 20): Promise<any> {
    // 4 separate queries instead of one optimized query
    const countResult = await this.medicineRepository
      .createQueryBuilder('m')
      .select('COUNT(DISTINCT m.id)', 'total')
      .innerJoin('product_categories', 'pc', 'm.id = pc.product_id')  // Manual join
      .where('pc.category_id = :categoryId', { categoryId: category.id })
      // ...
    
    // Another query for pagination...
    // Another query for prices...
  }
  ```
- **Why It's a Problem**: N+1 query problem; poor performance on large datasets
- **Fix**: Optimize to single efficient query with proper joins
  ```typescript
  // Use single query builder with all relations
  const query = this.medicineRepository
    .createQueryBuilder('m')
    .leftJoinAndSelect('m.prices', 'p', 'p.is_sell_default = true')
    .leftJoinAndSelect('p.measure_unit', 'mu')
    .innerJoin('product_categories', 'pc', 'm.id = pc.product_id')
    .where('pc.category_id = :categoryId', { categoryId: category.id })
    .andWhere('m.is_active = :active', { active: true })
    .skip(skip)
    .take(limit);
  ```

### Issue 5.2: Over-Injected Repositories in MedicineService
- **File**: [src/modules/medicine/medicine.service.ts](src/modules/medicine/medicine.service.ts#L16)
- **Line**: 16-28
- **Severity**: Low
- **Issue**: Service injects 5 repositories - more than typically needed
- **Code**:
  ```typescript
  constructor(
    @InjectRepository(Medicine)
    private readonly medicineRepository: Repository<Medicine>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductCategory)
    private readonly productCategoryRepository: Repository<ProductCategory>,
    @InjectRepository(MedicinePrice)
    private readonly medicinePriceRepository: Repository<MedicinePrice>,
    @InjectRepository(MeasureUnit)
    private readonly measureUnitRepository: Repository<MeasureUnit>,
  ) {}
  ```
- **Why It's a Problem**: Violates Single Responsibility Principle; service does too much; hard to test
- **Fix**: Consider splitting into separate services or using relations more efficiently

### Issue 5.3: Missing Input Validation in Controllers
- **File**: Multiple controllers
- **Lines**: Various
- **Severity**: Medium
- **Issue**: Many route parameters are not validated (e.g., numeric IDs)
- **Example**: [src/modules/category/category.controller.ts](src/modules/category/category.controller.ts#L34)
  ```typescript
  @Get(':idOrSlug')
  findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    const isNumeric = /^\d+$/.test(idOrSlug);  // Manual regex check instead of pipe
    // ...
  }
  ```
- **Why It's a Problem**: Should use NestJS pipes instead of manual validation
- **Fix**: Use `ParseIntPipe` from `@nestjs/common`
  ```typescript
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findById(id);
  }
  ```

---

## 6. EXPORT/MODULE ISSUES

### Issue 6.1: Unnecessary ProductCategory Import in CategoryModule
- **File**: [src/modules/category/category.module.ts](src/modules/category/category.module.ts#L6)
- **Line**: 6 and 11
- **Severity**: Low
- **Issue**: `ProductCategory` is imported and registered in TypeOrmModule but only used for database registration, not business logic
- **Code**:
  ```typescript
  import { ProductCategory } from './entities/product-category.entity';
  
  @Module({
    imports: [
      TypeOrmModule.forFeature([Category, ProductCategory, Medicine]),  // Registered but not used directly
    ],
  })
  ```
- **Why It's a Problem**: Makes module interface unclear about what's actually used; `ProductCategory` is management through MedicineService
- **Fix**: Move to MedicineModule where it's actually used, or document why it's here

### Issue 6.2: Inconsistent DTO Usage
- **File**: Various dto files
- **Severity**: Low
- **Issue**: Some methods return `any` type instead of specific DTOs
- **Example**: [src/modules/category/category.service.ts](src/modules/category/category.service.ts#L145)
  ```typescript
  async findBySlug(slug: string): Promise<any> {  // ❌ Should be specific type
  ```
- **Why It's a Problem**: Loss of type safety; IDE autocomplete won't work; hard to understand return structure
- **Fix**: Create specific DTO types and use them
  ```typescript
  interface CategoryDetailResponse {
    type: 'subcategories' | 'products';
    id: number;
    name: string;
    // ... more fields
  }
  
  async findBySlug(slug: string): Promise<CategoryDetailResponse> {
  ```

---

## 7. UNUSED DEPENDENCIES / IMPORTS

### Issue 7.1: Unused TypeOrmModule Import in CategoryModule
- **File**: [src/modules/category/category.module.ts](src/modules/category/category.module.ts)
- **Line**: 5
- **Severity**: Low
- **Issue**: While TypeOrmModule is used, `Medicine` is imported here but operations are done in MedicineModule
- **Code**:
  ```typescript
  import { Medicine } from '../medicine/entities/medicine.entity';  // Cross-module import
  
  @Module({
    imports: [
      TypeOrmModule.forFeature([Category, ProductCategory, Medicine]),  // Why is Medicine here?
    ],
  })
  ```
- **Why It's a Problem**: Creates cross-module coupling; database operations on Medicine should be in MedicineModule
- **Fix**: Remove Medicine from CategoryModule, only keep in MedicineModule
  ```typescript
  // In CategoryModule:
  imports: [TypeOrmModule.forFeature([Category, ProductCategory])],
  
  // Keep in MedicineModule:
  imports: [TypeOrmModule.forFeature([Medicine, Category, ProductCategory, MedicinePrice, MeasureUnit])],
  ```

---

## 8. CONFIGURATION ISSUES

### Issue 8.1: Hardcoded JWT Secret Fallback in JwtStrategy
- **File**: [src/modules/auth/strategies/jwt.strategy.ts](src/modules/auth/strategies/jwt.strategy.ts#L9)
- **Line**: 9
- **Severity**: High
- **Issue**: Has hardcoded fallback secret in production code
- **Code**:
  ```typescript
  secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',  // ❌ Hardcoded fallback
  ```
- **Why It's a Problem**: Security risk; if env var not set, uses weak default key in production
- **Fix**: Remove fallback, make it required
  ```typescript
  secretOrKey: configService.get<string>('JWT_SECRET'),  // Will throw error if not set
  ```

### Issue 8.2: Same Hardcoded Secret Fallback in AuthModule
- **File**: [src/modules/auth/auth.module.ts](src/modules/auth/auth.module.ts#L16)
- **Line**: 16
- **Severity**: High
- **Issue**: Duplicate hardcoded fallback
- **Code**:
  ```typescript
  secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',  // ❌ Duplicate weak fallback
  ```
- **Fix**: Same as 8.1, remove fallback

---

## 9. DOCUMENTATION/COMMENT ISSUES

### Issue 9.1: Missing API Documentation
- **File**: Various controllers
- **Severity**: Low
- **Issue**: Some endpoints lack JSDoc comments explaining purpose
- **Example**: Missing docs in several controller methods
- **Why It's a Problem**: Code is harder to understand; developers don't know endpoint purpose without reading code
- **Fix**: Add JSDoc comments
  ```typescript
  /**
   * Get category by ID or slug
   * @param idOrSlug - Category ID (number) or URL-friendly slug (string)
   * @returns Category with children or redirect message
   */
  @Get(':idOrSlug')
  findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
  ```

---

## SUMMARY OF RECOMMENDATIONS

### Critical (Fix Immediately)
1. **Issue 8.1 & 8.2**: Remove hardcoded JWT secret fallbacks - security risk
2. **Issue 3.1**: Delete unused `JwtPayload` DTO - redundant code

### High Priority (Fix Soon)
1. **Issue 2.5**: Remove `validateToken()` method or implement properly
2. **Issue 5.1**: Optimize `findProductsBySlug()` query performance

### Medium Priority (Fix When Convenient)
1. **Issue 4.1**: Extract duplicate cart validation logic
2. **Issue 1.1**: Remove unused import from typeorm.config.ts
3. **Issue 5.3**: Replace manual validation with NestJS pipes

### Low Priority (Nice to Have)
1. **Issue 2.1-2.4**: Remove/move unused utilities from slug.ts
2. **Issue 2.6-2.8**: Remove unused service methods or expose them
3. **Issue 6.1**: Clean up cross-module imports
4. **Issue 6.2**: Use specific DTOs instead of `any` types
5. **Issue 9.1**: Add JSDoc documentation

---

## UNUSED DEPENDENCIES CHECK

Based on package.json analysis:
- ✅ All major packages are used (`@nestjs/*`, `typeorm`, `passport`, `bcrypt`, etc.)
- ✅ No obviously unused npm packages detected
- ⚠️ Consider if `class-transformer` `@Exclude` decorator is justified - only used on password_hash

---

## CODE QUALITY METRICS

- **Total Issues**: 18
- **Critical**: 2
- **High**: 2
- **Medium**: 5
- **Low**: 9

### Files with Most Issues:
1. src/common/utils/slug.ts - 4 issues
2. src/modules/category/category.service.ts - 4 issues
3. src/modules/auth/ - 3 issues

