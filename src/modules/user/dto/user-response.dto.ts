import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  
  @Exclude()
  password_hash: string;

  created_at: Date;
  updated_at: Date;
}
