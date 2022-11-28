import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserSharedDto } from '../../../../shared/user/dto';
import { MediaResponseDto } from '../../../media/dto/response';
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
    type: UserSharedDto,
  })
  @Expose()
  @Type(() => UserSharedDto)
  public actor: UserSharedDto;

  public constructor(data: Partial<ArticleSearchResponseDto>) {
    Object.assign(this, data);
  }
}
