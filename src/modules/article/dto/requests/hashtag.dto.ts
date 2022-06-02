import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class HashtagDto {
  @ApiProperty({
    type: String,
  })
  @IsNotEmpty()
  public name: string;

  @ApiProperty({
    type: String,
  })
  @IsOptional()
  public id?: string;
}
