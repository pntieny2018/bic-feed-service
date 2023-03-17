import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { POST_TYPE } from '../../../data-type';
export class RecentSearchesResponseDto {
  @ApiProperty({
    enum: POST_TYPE,
    description: 'Target entity',
  })
  @Expose()
  public target: POST_TYPE;

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
