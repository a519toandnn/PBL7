import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UserRole } from '../user/entities/user.entity';
import { MeasureUnitService } from './measure-unit.service';

@Controller('measure-units')
@UseGuards(JwtGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MeasureUnitController {
  constructor(private readonly measureUnitService: MeasureUnitService) {}

  @Get()
  findAll() {
    return this.measureUnitService.findAll();
  }
}
