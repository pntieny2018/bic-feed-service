import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

import { OrderEnum, PaginatedArgs } from '../../../../../common/dto';
import { PostType } from '../../../data-type';

export class GetDraftContentsRequestDto extends PaginatedArgs {
  @ApiProperty({
    enum: OrderEnum,
    default: OrderEnum.DESC,
    required: false,
  })
  @IsEnum(OrderEnum)
  public order: OrderEnum = OrderEnum.DESC;

  @ApiPropertyOptional({
    name: 'is_processing',
    required: false,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_processing' })
  @Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return null;
  })
  public isProcessing?: boolean;

  @ApiProperty({
    description: 'Content type',
    required: false,
    default: '',
    enum: PostType,
  })
  @Expose()
  @IsOptional()
  @IsEnum(PostType)
  @ValidateIf((i) => i.type !== '')
  public type?: PostType;
}

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
    name: 'content_types',
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

  @ApiPropertyOptional({
    type: 'boolean',
    required: false,
    default: true,
    name: 'is_included_inner_groups',
  })
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => value && value === 'true')
  @Expose({
    name: 'is_included_inner_groups',
  })
  public isIncludedInnerGroups: boolean;
}
