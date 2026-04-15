import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Cart } from '../../cart/entities/cart.entity';
import { Medicine } from '../../medicine/entities/medicine.entity';
import { MeasureUnit } from '../../medicine/entities/measure-unit.entity';

@Entity('cart_items')
@Unique(['cart', 'product', 'measure_unit'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  unit_price_snapshot: number | null;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ManyToOne(() => Medicine, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Medicine;

  @ManyToOne(() => MeasureUnit, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'measure_unit_id' })
  measure_unit: MeasureUnit | null;
}