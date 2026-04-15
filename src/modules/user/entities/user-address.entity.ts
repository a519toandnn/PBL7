import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_addresses')
export class UserAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

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

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @UpdateDateColumn()
  updated_at: Date;
}
