import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_shipping_addresses')
export class OrderShippingAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order, (order) => order.shipping_address, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'varchar', length: 255 })
  receiver_name: string;

  @Column({ type: 'varchar', length: 30 })
  receiver_phone: string;

  @Column({ type: 'text' })
  address_line: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ward: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  province: string | null;

  @CreateDateColumn()
  created_at: Date;
}
