import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PostResponseDto } from '../../../post/dto/responses';

export class ArticleResponseDto extends PostResponseDto {
  @ApiProperty({
    description: 'Title',
    type: String,
  })
  @Expose()
  public title: string;

  @ApiProperty({
    description: 'Summary',
    type: String,
  })
  @Expose()
  public summary: string;

  @ApiProperty({
    description: 'Categories',
    type: String,
  })
  @Expose()
  public categories: any;

  @ApiProperty({
    description: 'Series',
    type: String,
  })
  @Expose()
  public series: any;

  public constructor(data: Partial<ArticleResponseDto>) {
    super(data);
  }
}
