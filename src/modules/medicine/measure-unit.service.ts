import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasureUnit } from './entities/measure-unit.entity';

@Injectable()
export class MeasureUnitService {
  constructor(
    @InjectRepository(MeasureUnit)
    private readonly measureUnitRepository: Repository<MeasureUnit>,
  ) {}

  findAll(): Promise<Array<Pick<MeasureUnit, 'id' | 'name'>>> {
    return this.measureUnitRepository.find({
      select: {
        id: true,
        name: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }
}
