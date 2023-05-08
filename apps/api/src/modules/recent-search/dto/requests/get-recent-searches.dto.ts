import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto';
import { RecentSearchType } from '../../recent-search-type.constants';

export class GetRecentSearchPostDto extends PageOptionsDto {
  @ApiProperty({
    description: 'Target entity. Support[all,post,article,user]',
    default: RecentSearchType.POST,
    required: false,
    enum: RecentSearchType,
  })
  @IsOptional()
  @Transform((params) => {
    return params.value ?? RecentSearchType.POST;
  })
  public target?: RecentSearchType = RecentSearchType.ALL;
}
