import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, DefaultValuePipe, UseGuards, BadRequestException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtGuard, AdminGuard)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':slug/products')
  findProductsBySlug(
    @Param('slug') slug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    return this.categoryService.findProductsBySlug(
      slug,
      page,
      Math.min(limit, 100),
    );
  }

  @Get(':idOrSlug')
  findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    // Try to parse as number first
    const id = parseInt(idOrSlug, 10);
    if (!isNaN(id)) {
      return this.categoryService.findById(id);
    }
    // Otherwise treat as slug
    return this.categoryService.findBySlug(idOrSlug);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
