import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { OrderItem } from '../../orderitem/entities/orderitem.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { OrderShippingAddress } from './order-shipping-address.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  order_no: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_amount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @OneToOne(
    () => OrderShippingAddress,
    (shippingAddress) => shippingAddress.order,
    {
      cascade: true,
    },
  )
  shipping_address: OrderShippingAddress | null;
}
