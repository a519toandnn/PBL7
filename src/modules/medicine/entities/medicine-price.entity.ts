import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Medicine } from './medicine.entity';
import { MeasureUnit } from './measure-unit.entity';

@Entity('product_prices')
@Index('idx_product_price_product_unit_unique', ['product', 'measure_unit'], {
  unique: true,
})
export class MedicinePrice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Medicine, (product) => product.prices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Medicine;

  @ManyToOne(() => MeasureUnit, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'measure_unit_id' })
  measure_unit: MeasureUnit;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'boolean', default: false })
  is_sell_default: boolean;

  @UpdateDateColumn()
  updated_at: Date;
}
