import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('measure_units')
export class MeasureUnit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;
}
