import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, MinLength } from 'class-validator';

const MIN_LENGTH = 3;
export class SearchTagRequestDto {
  @ApiProperty({ description: 'Search tags by keyword', required: true })
  @IsNotEmpty()
  @Type(() => String)
  @MinLength(MIN_LENGTH)
  @Expose({
    name: 'keyword',
  })
  public keyword: string;
}
