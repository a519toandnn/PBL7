import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { MedicineService } from './medicine.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { MedicineListItemDto } from './dto/medicine-listing.dto';
import { MedicineSearchItemDto } from './dto/medicine-search.dto';
import { MedicineDetailDto } from './dto/medicine-detail.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('medicines')
export class MedicineController {
  constructor(private readonly medicineService: MedicineService) {}

  @Get()
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<MedicineListItemDto[]> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    return this.medicineService.findAllPaginated(page, Math.min(limit, 100));
  }

  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<MedicineSearchItemDto[]> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('page and limit must be greater than 0');
    }

    return this.medicineService.searchBySlug(query, page, Math.min(limit, 50));
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<MedicineDetailDto> {
    return this.medicineService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtGuard, AdminGuard)
  create(@Body() createMedicineDto: CreateMedicineDto) {
    return this.medicineService.create(createMedicineDto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateMedicineDto: UpdateMedicineDto) {
    return this.medicineService.update(id, updateMedicineDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.medicineService.remove(id);
  }
}