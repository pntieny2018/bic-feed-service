import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { RecentSearchType } from '../../recent-search-type.constants';

export class GetRecentSearchPostDto {
  @ApiProperty({
    description: 'Sort recent search by created time',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform((params) => params.value ?? 'desc')
  sort?: 'asc' | 'desc' = 'desc';

  @ApiProperty({
    description: 'Limit recent search',
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Transform((params) => parseInt(params.value) ?? 10)
  limit?: number;

  @ApiProperty({
    description: 'Target entity. Support[all,post,article,user]',
    default: RecentSearchType.POST,
    required: false,
  })
  @IsOptional()
  @Transform((params) => {
    return params.value ?? RecentSearchType.POST;
  })
  target?: RecentSearchType = RecentSearchType.ALL;
}
