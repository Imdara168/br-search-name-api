import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRegistrationDto {
  @IsNotEmpty()
  @IsString()
  name_en: string;

  @IsNotEmpty()
  @IsString()
  name_kh: string;
}
