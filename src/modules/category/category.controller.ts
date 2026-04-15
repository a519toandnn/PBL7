import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
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
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.categoryService.findProductsBySlug(
      slug,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':idOrSlug')
  findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    const isNumeric = /^\d+$/.test(idOrSlug);
    if (isNumeric) {
      return this.categoryService.findById(+idOrSlug);
    }
    return this.categoryService.findBySlug(idOrSlug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
