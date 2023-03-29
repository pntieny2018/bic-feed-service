import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { RecentSearchResponseDto } from './recent-search.response.dto';
import { RecentSearchType } from '../../../data-type/recent-search-type.enum';
export class RecentSearchesResponseDto {
  @ApiProperty({
    enum: RecentSearchType,
    description: 'Target entity',
  })
  @Expose()
  public target: RecentSearchType;

  @ApiProperty({
    description: 'List recent search',
    type: RecentSearchResponseDto,
    isArray: true,
    name: 'recent_searches',
  })
  @Type(() => RecentSearchResponseDto)
  @Expose()
  public recentSearches: RecentSearchResponseDto[];

  public constructor(data: Partial<RecentSearchesResponseDto>) {
    Object.assign(this, data);
  }
}
