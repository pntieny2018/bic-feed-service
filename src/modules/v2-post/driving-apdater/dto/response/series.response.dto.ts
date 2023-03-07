import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArticleResponseDto } from '../../../../article/dto/responses';

export class ArticleInSeriesResponseDto extends PickType(ArticleResponseDto, [
  'id',
  'title',
  'summary',
  'audience',
  'categories',
  'setting',
  'actor',
  'coverMedia',
  'createdAt',
  'updatedAt',
] as const) {}

export class SeriesResponseDto extends PickType(ArticleResponseDto, [
  'id',
  'title',
  'summary',
  'actor',
  'audience',
  'setting',
  'createdAt',
  'updatedAt',
  'coverMedia',
  'communities',
] as const) {
  @ApiProperty({
    type: [ArticleInSeriesResponseDto],
    name: 'articles',
  })
  @Expose()
  public articles?: ArticleInSeriesResponseDto[];

  public constructor(data: Partial<SeriesResponseDto>) {
    super(data);
  }
}
