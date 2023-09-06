import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class SearchTagRequestDto {
  @ApiProperty({ description: 'Search tags by keyword', required: true })
  @IsNotEmpty()
  @Type(() => String)
  @Expose({
    name: 'keyword',
  })
  public keyword?: string;
}
