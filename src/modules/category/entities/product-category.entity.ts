import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { Category } from './category.entity';
import { Medicine } from '../../medicine/entities/medicine.entity';

@Entity('product_categories')
@Index('idx_product_categories_category_id', ['category_id'])
export class ProductCategory {
  @PrimaryColumn()
  product_id: number;

  @PrimaryColumn()
  category_id: number;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @ManyToOne(() => Medicine, (product) => product.category_links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Medicine;

  @ManyToOne(() => Category, (category) => category.product_links, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
