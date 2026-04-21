import { IsOptional, IsString } from 'class-validator';

export class UpdateRegistrationDto {
  @IsOptional()
  @IsString()
  name_en?: string;

  @IsOptional()
  @IsString()
  name_kh?: string;

  @IsOptional()
  @IsString()
  entity_code?: string;
}
