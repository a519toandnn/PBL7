import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';

@Entity('categories')
@Index(['slug'])
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 320, unique: true })
  slug: string;

  @ManyToOne(() => Category, (category) => category.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @Column({ type: 'smallint', default: 1 })
  level: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ProductCategory, (productCategory) => productCategory.category)
  product_links: ProductCategory[];
}