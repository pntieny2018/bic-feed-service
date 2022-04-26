import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { RecentSearchDto } from './recent-search.dto';
import { RecentSearchType } from '../../recent-search-type.constants';

export class RecentSearchesDto {
  @ApiProperty({
    enum: RecentSearchType,
    description: 'Target entity',
  })
  @Expose()
  public target: RecentSearchType;

  @ApiProperty({
    description: 'List recent search',
    type: RecentSearchDto,
    isArray: true,
  })
  @Type(() => RecentSearchDto)
  @Expose()
  public recentSearches: RecentSearchDto[];
}
