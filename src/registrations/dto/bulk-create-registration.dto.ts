import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRegistrationDto } from './create-registration.dto';

export class BulkCreateRegistrationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRegistrationDto)
  data: CreateRegistrationDto[];
}
