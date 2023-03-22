import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PostType } from '../../../data-type';
export class RecentSearchesResponseDto {
  @ApiProperty({
    enum: PostType,
    description: 'Target entity',
  })
  @Expose()
  public target: PostType;

  @ApiProperty({
    description: 'List recent search',
    type: RecentSearchesResponseDto,
    isArray: true,
    name: 'recent_searches',
  })
  @Type(() => RecentSearchesResponseDto)
  @Expose()
  public recentSearches: RecentSearchesResponseDto[];

  public constructor(data: Partial<RecentSearchesResponseDto>) {
    Object.assign(this, data);
  }
}
