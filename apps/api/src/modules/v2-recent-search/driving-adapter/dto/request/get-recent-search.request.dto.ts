import { PageOptionsDto } from '../../../../../common/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { RecentSearchType } from '../../../data-type';

export class GetRecentSearchRequestDto extends PageOptionsDto {
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
