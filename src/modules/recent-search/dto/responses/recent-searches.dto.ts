import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { RecentSearchDto } from './recent-search.dto';
import { RecentSearchType } from '../../recent-search-type.constants';

export class RecentSearchesDto {
  @ApiProperty({
    description: 'Target entity',
  })
  @Expose()
  public target: RecentSearchType;

  @ApiProperty({
    description: 'List recent search',
  })
  @Type(() => RecentSearchDto)
  @Expose()
  public recentSearches: RecentSearchDto[];
}
