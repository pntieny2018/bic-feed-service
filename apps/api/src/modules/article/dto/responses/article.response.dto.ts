import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PostResponseDto } from '../../../post/dto/responses';
import { LinkPreviewDto } from '../../../link-preview/dto/link-preview.dto';
import { MediaResponseDto } from '../../../media/dto/response';
import { CategoryResponseDto } from './category.response.dto';

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
    description: 'isLocked',
    type: Boolean,
  })
  @Expose()
  public isLocked: boolean;

  @ApiProperty({
    description: 'zindex',
    type: Number,
  })
  @Expose()
  public zindex?: number;

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

  @ApiProperty({
    type: Date,
    name: 'published_at',
  })
  @Expose()
  public publishedAt?: Date;

  @ApiProperty({
    type: Date,
    name: 'scheduled_at',
  })
  @Expose()
  public scheduledAt?: Date;

  public constructor(data: Partial<ArticleResponseDto>) {
    super(data);
  }
}
