import { ApiProperty, PickType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { SeriesResponseDto } from '.';
import { PostResponseDto } from '../../../../post/dto/responses';
import { TagResponseDto } from '../../../../tag/dto/responses/tag-response.dto';
import { MediaResponseDto } from './media.response.dto';

class SeriesSimpleResponseDto extends PickType(SeriesResponseDto, ['id', 'title'] as const) {}

export class ArticleResponseDto extends PostResponseDto {
  @ApiProperty()
  public title: string;

  @ApiProperty()
  public summary: string;

  @ApiProperty({
    description: 'Series',
    type: [SeriesSimpleResponseDto],
  })
  public series: SeriesSimpleResponseDto[];

  @ApiProperty()
  @Transform(({ obj }) => {
    if (obj.tagsJson === null) return [];
    return obj.tagsJson;
  })
  public tags: TagResponseDto[];

  @ApiProperty({
    type: MediaResponseDto,
    name: 'cover_media',
  })
  public coverMedia?: MediaResponseDto;

  public constructor(data: Partial<ArticleResponseDto>) {
    super(data);
  }
}
