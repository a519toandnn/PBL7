import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { MedicinePrice } from './medicine-price.entity';
import { ProductCategory } from '../../category/entities/product-category.entity';

export enum ProductType {
  DRUG = 'DRUG',
  SUPPLEMENT = 'SUPPLEMENT',
  OTHER = 'OTHER',
}

@Entity('products')
@Index('idx_product_active_created', ['is_active', 'created_at'])
export class Medicine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'varchar', length: 700, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.OTHER,
  })
  product_type: ProductType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  image_url: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at: Date | null;

  // Medical info denormalized into products table
  @Column({ type: 'text', nullable: true })
  usage: string | null;

  @Column({ type: 'text', nullable: true })
  dosage: string | null;

  @Column({ type: 'text', nullable: true })
  adverse_effect: string | null;

  @Column({ type: 'text', nullable: true })
  careful: string | null;

  @Column({ type: 'text', nullable: true })
  preservation: string | null;

  @OneToMany(() => MedicinePrice, (price) => price.product, {
    cascade: true,
  })
  prices: MedicinePrice[];

  @OneToMany(() => ProductCategory, (categoryLink) => categoryLink.product, {
    cascade: true,
  })
  category_links: ProductCategory[];
}