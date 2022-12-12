import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CategoryResponseDto {
  @ApiProperty({
    type: String,
  })
  @Expose()
  public id: string;
  @ApiProperty({
    type: String,
  })
  @Expose()
  public name: string;
}
