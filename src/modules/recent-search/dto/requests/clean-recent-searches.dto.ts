import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RecentSearchType } from '../../recent-search-type.constants';

export class CleanRecentSearchesDto {
  @ApiProperty({
    description: 'Target entity. Support [all,post,article,user]',
    default: RecentSearchType.ALL,
  })
  @IsEnum(RecentSearchType, {
    message: 'Target must be "post" | "article" | "artical" | "all"',
  })
  @IsNotEmpty()
  target: RecentSearchType;
}
