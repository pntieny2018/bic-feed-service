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
import { RULES } from '@api/modules/v2-post/constant';
import { MaxArticleLength } from '@api/modules/v2-post/driving-apdater/custom-validation/MaxArticleLength.validation';

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
  @MaxArticleLength(RULES.MAX_ARTICLE_CONTENT_CHARACTER, {
    message: `Your article cannot exceed ${new Intl.NumberFormat('de-ES').format(
      RULES.MAX_ARTICLE_CONTENT_CHARACTER
    )} characters. `,
  })
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
  public coverMedia?: MediaItemDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Expose({ name: 'word_count' })
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
