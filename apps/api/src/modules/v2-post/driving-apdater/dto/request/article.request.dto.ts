import { PageOptionsDto } from '@api/common/dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { MediaRequestDto, MediaItemDto } from '../../../application/dto';

import { AudienceRequestDto } from './audience.request.dto';

export class UpdateArticleRequestDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  public title?: string;

  @ApiPropertyOptional({
    type: String,
  })
  @IsOptional()
  public summary?: string;

  @ApiProperty({ description: 'Content of post', type: String })
  @IsOptional()
  public content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  public categories?: string[];

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  public series?: string[];

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  public tags?: string[];

  @ApiProperty({ description: 'Audience', type: AudienceRequestDto, required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto;

  @ApiPropertyOptional({ type: MediaRequestDto })
  @IsOptional()
  @Expose({ name: 'cover_media' })
  @Transform((data) => {
    if (!data.obj.cover_media && data.obj.coverMedia) {
      return data.obj.coverMedia;
    }
    return data.obj.cover_media;
  })
  public coverMedia?: MediaItemDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Expose({ name: 'word_count' })
  @Transform((data) => {
    if (!data.obj.word_count && data.obj.wordCount) {
      return data.obj.wordCount;
    }
    return data.obj.word_count;
  })
  public wordCount?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  @IsArray()
  public hashtags?: string[];

  public constructor(data: UpdateArticleRequestDto) {
    Object.assign(this, data);
  }
}

export class PublishArticleRequestDto extends UpdateArticleRequestDto {}

export class ScheduleArticleRequestDto extends PublishArticleRequestDto {
  @ApiProperty({ type: Date, required: true })
  @Expose({ name: 'scheduled_at' })
  @Transform((data) => {
    if (!data.obj.scheduled_at && data.obj.scheduledAt) {
      return data.obj.scheduledAt;
    }
    return data.obj.scheduled_at;
  })
  @IsNotEmpty()
  @IsDateString()
  public scheduledAt: Date;

  public constructor(data: ScheduleArticleRequestDto) {
    super(data);
    Object.assign(this, data);
  }
}

export class CreateDraftArticleRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @ValidateIf((i) => i.audience)
  @Type(() => AudienceRequestDto)
  public audience: AudienceRequestDto;
  public constructor(data: CreateDraftArticleRequestDto) {
    Object.assign(this, data);
  }
}

export class SearchArticlesDto extends PageOptionsDto {
  @ApiProperty({ description: 'filter content', required: false, name: 'content_search' })
  @IsOptional()
  @IsString()
  @Expose({
    name: 'content_search',
  })
  @Transform((data) => {
    if (!data.obj.content_search && data.obj.contentSearch) {
      return data.obj.contentSearch;
    }
    return data.obj.content_search;
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
  @Transform((data) => {
    if (!data.obj.group_ids && data.obj.groupIds) {
      return data.obj.groupIds;
    }
    return data.obj.group_ids;
  })
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
  @Transform((data) => {
    if (!data.obj.category_ids && data.obj.categoryIds) {
      return data.obj.categoryIds;
    }
    return data.obj.category_ids;
  })
  public categoryIds?: string[];

  @ApiProperty({
    type: Boolean,
    required: false,
    default: false,
    name: 'limit_series',
  })
  @Expose({
    name: 'limit_series',
  })
  @Transform((data) => {
    if (!data.obj.limit_series && data.obj.limitSeries) {
      return data.obj.limitSeries === 'true';
    }
    return data.obj.limit_series === 'true';
  })
  @IsOptional()
  @IsBoolean()
  public limitSeries?: boolean;
}
