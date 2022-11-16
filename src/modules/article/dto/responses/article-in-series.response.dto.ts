import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { CategoryResponseDto } from '.';
import { MediaResponseDto } from '../../../media/dto/response';

export class ArticleInSeriesResponseDto {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
  @IsUUID()
  @Expose()
  public id: string;

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

  @Expose()
  public lang?: string;

  @ApiProperty({
    description: 'Categories',
    type: [CategoryResponseDto],
  })
  @Expose()
  public categories: CategoryResponseDto[];

  @ApiProperty({
    type: MediaResponseDto,
    name: 'cover_media',
  })
  @Expose()
  public coverMedia?: MediaResponseDto;

  public constructor(data: Partial<ArticleInSeriesResponseDto>) {
    Object.assign(this, data);
  }
}
