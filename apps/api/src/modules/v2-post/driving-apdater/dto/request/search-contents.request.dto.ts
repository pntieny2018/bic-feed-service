import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PostType } from '../../../data-type';

export class SearchContentsRequestDto {
  @ApiPropertyOptional({
    description: 'List of creator',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  @Expose({
    name: 'actors',
  })
  public actors?: string[];

  @ApiPropertyOptional({
    description: 'Filter by keyword',
  })
  @IsOptional()
  @IsString()
  @Expose({
    name: 'keyword',
  })
  public keyword?: string;

  @ApiPropertyOptional({
    description: 'Search by tags',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  @Expose({
    name: 'tags',
  })
  public tags?: string[];

  @ApiPropertyOptional({
    description: 'Search by topics',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  @Expose({
    name: 'topics',
  })
  public topics?: string[];

  @ApiPropertyOptional({
    description: 'Filter posts created_time > start_time',
    required: false,
    name: 'start_time',
  })
  @IsOptional()
  @IsDateString()
  @Expose({
    name: 'start_time',
  })
  public startTime?: string;

  @ApiPropertyOptional({
    description: 'Filter posts created_time < end_time',
    required: false,
    name: 'end_time',
  })
  @IsOptional()
  @IsDateString()
  @Expose({
    name: 'end_time',
  })
  public endTime?: string;

  @ApiPropertyOptional({
    description: 'Filter by group',
    required: false,
    name: 'group_id',
  })
  @Expose({
    name: 'group_id',
  })
  @Type(() => String)
  @IsUUID()
  @IsOptional()
  public groupId?: string;

  @ApiPropertyOptional({
    description: 'Filter by type of contents',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  @IsEnum(PostType, { each: true })
  @Expose({
    name: 'content_types',
  })
  public contentTypes?: PostType[];
}
