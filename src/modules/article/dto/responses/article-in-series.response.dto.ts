import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';
import { CategoryResponseDto, HashtagResponseDto } from '.';
import { MediaResponseDto } from '../../../media/dto/response';
import { PostResponseDto } from '../../../post/dto/responses';

export class ArticleInSeriesResponseDto extends PostResponseDto {
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
    description: 'Hashtags',
    type: [HashtagResponseDto],
  })
  @Expose()
  public hashtags: HashtagResponseDto;

  @ApiProperty({
    type: MediaResponseDto,
    name: 'cover_media',
  })
  @Expose()
  public coverMedia?: MediaResponseDto;

  public constructor(data: Partial<ArticleInSeriesResponseDto>) {
    super(data);
  }
}
