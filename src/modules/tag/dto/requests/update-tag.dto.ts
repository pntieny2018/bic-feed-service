import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTagDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @MaxLength(32)
  public name: string;
}
