import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHashtagDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  public name: string;
}
