import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PostResponseDto } from '../../../post/dto/responses';
import { LinkPreviewDto } from '../../../link-preview/dto/link-preview.dto';
import { MediaResponseDto } from '../../../media/dto/response';

class CategoryResponseDto {
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

class SeriesResponseDto {
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

class HashtagResponseDto {
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

  @Expose()
  public lang?: string;

  @ApiProperty({
    description: 'Categories',
    type: [CategoryResponseDto],
  })
  @Expose()
  public categories: CategoryResponseDto[];

  @ApiProperty({
    description: 'Series',
    type: [SeriesResponseDto],
  })
  @Expose()
  public series: SeriesResponseDto[];

  @ApiProperty({
    description: 'Hashtags',
    type: [HashtagResponseDto],
  })
  @Expose()
  public hashtags: HashtagResponseDto[];

  @ApiProperty({
    description: 'isLocked',
    type: Boolean,
  })
  @Expose()
  public isLocked: boolean;

  @ApiProperty({
    description: 'views',
    type: Number,
  })
  @Expose()
  public views: number;

  @ApiProperty({
    type: LinkPreviewDto,
    example: {
      url: 'https://beincomm.com',
      domain: 'beincomm.com',
      image: 'https://www.beincomm.com/images/bic_welcomeAd_banner.webp',
      title: 'This is title',
      description: 'This is description',
    },
    name: 'link_preview',
  })
  @Expose()
  public linkPreview?: LinkPreviewDto;

  @ApiProperty({
    type: MediaResponseDto,
    name: 'cover_media',
  })
  @Expose()
  public coverMedia?: MediaResponseDto;

  public constructor(data: Partial<ArticleResponseDto>) {
    super(data);
  }
}
