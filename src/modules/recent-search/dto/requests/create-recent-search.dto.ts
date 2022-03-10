import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RecentSearchType } from '../../recent-search-type.constants';

export class CreateRecentSearchDto {
  @ApiProperty({
    description: 'The keyword input when user search',
    example: 'Hi !',
  })
  @IsString()
  @IsNotEmpty()
  @Transform((params) => (params.value ? params.value.trim() : ''))
  keyword: string;

  @ApiProperty({
    description: 'Target entity. Support: [post,user,article]',
    required: false,
    default: RecentSearchType.POST,
    example: RecentSearchType.POST,
  })
  @IsEnum(RecentSearchType, {
    message: 'Target must be "post" | "article" | "artical" | "all"',
  })
  @Transform((params) => params.value ?? RecentSearchType.POST)
  target: string = RecentSearchType.POST;
}
