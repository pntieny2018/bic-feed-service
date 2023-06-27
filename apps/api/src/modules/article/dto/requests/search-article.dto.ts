import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { RULES } from '../../../v2-post/constant';
import { IsArray, IsInt, IsOptional, IsString, IsUUID } from 'class-validator';
import { PageOptionsDto } from '../../../../common/dto/pagination/page-options.dto';

export class SearchArticlesDto extends PageOptionsDto {
  @ApiProperty({ description: 'filter content', required: false, name: 'content_search' })
  @IsOptional()
  @IsString()
  @Expose({
    name: 'content_search',
  })
  public contentSearch?: string;

  @ApiProperty({
    description: 'Group IDs',
    required: false,
    name: 'group_ids',
  })
  @Expose({
    name: 'group_ids',
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  public groupIds?: string[];

  @ApiProperty({
    description: 'Category IDs',
    required: false,
    name: 'category_ids',
  })
  @Expose({
    name: 'category_ids',
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  public categoryIds?: string[];

  @ApiProperty({
    default: RULES.LIMIT_MAX_SERIES,
    required: false,
  })
  @Expose({
    name: 'limit_series',
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  public limitSeries?: number;
}
