import { IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
