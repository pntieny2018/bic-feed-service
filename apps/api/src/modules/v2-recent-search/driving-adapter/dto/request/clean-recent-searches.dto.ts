import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RecentSearchType } from '../../../data-type';

export class CleanRecentSearchesDto {
  @ApiProperty({
    description: 'Target entity. Support [all,post,article,user]',
    default: RecentSearchType.POST,
    enum: RecentSearchType,
  })
  @IsEnum(RecentSearchType, {
    message: 'Target must be "post" | "article"  | "all"',
  })
  @IsNotEmpty()
  public target: RecentSearchType;
}
