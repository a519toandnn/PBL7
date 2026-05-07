import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDoctorMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  userId: string; // patient id

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;
}
