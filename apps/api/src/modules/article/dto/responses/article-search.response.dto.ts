import { UserDto } from '@libs/service/user';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { MediaResponseDto } from '../../../media/dto/response';
import { AudienceResponseDto } from '../../../post/dto/responses';

import { CategoryResponseDto } from './category.response.dto';

export class ArticleSearchResponseDto {
  @ApiProperty({
    description: 'Post ID',
    type: String,
  })
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

  @ApiProperty({
    type: AudienceResponseDto,
  })
  @Expose()
  public audience: AudienceResponseDto;

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

  @ApiProperty({
    description: 'Post creator information',
    type: UserDto,
  })
  @Expose()
  public actor: UserDto;

  public constructor(data: Partial<ArticleSearchResponseDto>) {
    Object.assign(this, data);
  }
}
