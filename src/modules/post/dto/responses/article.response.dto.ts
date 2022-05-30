import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PostResponseDto } from '.';

export class ArticleResponseDto extends PostResponseDto {
  @ApiProperty({
    description: 'Categories',
    type: String,
  })
  @Expose()
  public categories: string;

  public constructor(data: Partial<ArticleResponseDto>) {
    super(data);
  }
}
