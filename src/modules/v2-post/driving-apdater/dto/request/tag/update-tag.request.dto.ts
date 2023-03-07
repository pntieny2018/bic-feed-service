import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateTagRequestDto {
  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @MaxLength(32)
  @Transform(({ value }) => {
    return value.toLowerCase().trim();
  })
  public name: string;
}
