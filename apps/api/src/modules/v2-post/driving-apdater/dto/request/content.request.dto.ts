import { CONTENT_TYPE, ORDER } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BooleanHelper } from 'apps/api/src/common/helpers';
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

import { PublishArticleRequestDto } from './article.request.dto';

export class GetDraftContentsRequestDto extends PaginatedArgs {
  @ApiProperty({ enum: ORDER, default: ORDER.DESC, required: false })
  @IsEnum(ORDER)
  public order: ORDER = ORDER.DESC;

  @ApiPropertyOptional({ name: 'is_processing', required: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Expose({ name: 'is_processing' })
  @Transform(({ value }) => BooleanHelper.convertStringToBoolean(value))
  public isProcessing?: boolean;

  @ApiProperty({ description: 'Content type', required: false, default: '', enum: CONTENT_TYPE })
  @IsOptional()
  @IsEnum(CONTENT_TYPE)
  @ValidateIf((i) => i.type !== '')
  public type?: CONTENT_TYPE;
}

export class SearchContentsRequestDto extends PaginatedArgs {
  @ApiPropertyOptional({ description: 'List of creator' })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  public actors?: string[];

  @ApiPropertyOptional({ description: 'Filter by keyword' })
  @IsOptional()
  @IsString()
  public keyword?: string;

  @ApiPropertyOptional({
    name: 'tag_ids',
    description: 'Search by tag ids',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  @Expose({
    name: 'tag_ids',
  })
  public tagIds?: string[];

  @ApiPropertyOptional({
    name: 'tag_names',
    description: 'Search by tag names',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString({ each: true })
  @IsArray()
  @Expose({
    name: 'tag_names',
  })
  public tagNames?: string[];

  @ApiPropertyOptional({ description: 'Search by topics' })
  @IsOptional()
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  public topics?: string[];

  @ApiPropertyOptional({
    description: 'Filter posts created_time > start_time',
    required: false,
    name: 'start_time',
  })
  @IsOptional()
  @IsDateString()
  @Expose({ name: 'start_time' })
  public startTime?: string;

  @ApiPropertyOptional({
    description: 'Filter posts created_time < end_time',
    required: false,
    name: 'end_time',
  })
  @IsOptional()
  @IsDateString()
  @Expose({ name: 'end_time' })
  public endTime?: string;

  @ApiPropertyOptional({ description: 'Filter by group', required: false, name: 'group_id' })
  @Type(() => String)
  @IsUUID()
  @IsOptional()
  @Expose({ name: 'group_id' })
  public groupId?: string;

  @ApiPropertyOptional({
    name: 'content_types',
    description: 'Filter by type of contents',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  @IsEnum(CONTENT_TYPE, { each: true })
  @Expose({ name: 'content_types' })
  public contentTypes?: CONTENT_TYPE[];

  @ApiPropertyOptional({
    type: 'boolean',
    required: false,
    default: true,
    name: 'is_included_inner_groups',
  })
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => value && value === 'true')
  @Expose({ name: 'is_included_inner_groups' })
  public isIncludedInnerGroups: boolean;
}

export class GetScheduleContentsQueryDto extends PaginatedArgs {
  @ApiPropertyOptional({ enum: ORDER, default: ORDER.ASC, required: false })
  @IsEnum(ORDER)
  @IsOptional()
  public order?: ORDER = ORDER.ASC;

  @ApiPropertyOptional({
    description: 'Filter by content type',
    enum: [CONTENT_TYPE.ARTICLE, CONTENT_TYPE.POST],
  })
  @IsOptional()
  @IsEnum([CONTENT_TYPE.ARTICLE, CONTENT_TYPE.POST])
  public type?: Exclude<CONTENT_TYPE, CONTENT_TYPE.SERIES>;
}

export class ScheduleContentRequestDto extends PublishArticleRequestDto {
  @ApiProperty({ required: true, type: Date })
  @IsNotEmpty()
  @IsDateString()
  @Expose({ name: 'scheduled_at' })
  public scheduledAt: Date;

  @ApiProperty({ required: true, enum: [CONTENT_TYPE.ARTICLE, CONTENT_TYPE.POST] })
  @Expose()
  @IsEnum([CONTENT_TYPE.ARTICLE, CONTENT_TYPE.POST])
  public type: Exclude<CONTENT_TYPE, CONTENT_TYPE.SERIES>;

  public constructor(data: ScheduleContentRequestDto) {
    super(data);
    Object.assign(this, data);
  }
}

export class PinContentDto {
  @ApiProperty({
    name: 'pin_group_ids',
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @Expose({
    name: 'pin_group_ids',
  })
  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  public pinGroupIds: string[];

  @ApiProperty({
    name: 'unpin_group_ids',
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
  })
  @Expose({
    name: 'unpin_group_ids',
  })
  @IsNotEmpty()
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  public unpinGroupIds: string[];
}
