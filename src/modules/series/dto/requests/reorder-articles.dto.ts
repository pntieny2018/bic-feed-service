import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class ReorderArticlesDto {
  @ApiProperty({
    type: [String],
    name: 'article_ids',
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  @Expose({
    name: 'article_ids',
  })
  public articleIds?: string[];
}
