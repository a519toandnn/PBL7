import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CartitemService } from './cartitem.service';
import { CreateCartitemDto } from './dto/create-cartitem.dto';
import { UpdateCartitemDto } from './dto/update-cartitem.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('cartitem')
@UseGuards(JwtGuard, AdminGuard)
export class CartitemController {
  constructor(private readonly cartitemService: CartitemService) {}

  @Post()
  create(@Body() createCartitemDto: CreateCartitemDto) {
    return this.cartitemService.create(createCartitemDto);
  }

  @Get()
  findAll() {
    return this.cartitemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartitemService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCartitemDto: UpdateCartitemDto,
  ) {
    return this.cartitemService.update(+id, updateCartitemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartitemService.remove(+id);
  }
}
