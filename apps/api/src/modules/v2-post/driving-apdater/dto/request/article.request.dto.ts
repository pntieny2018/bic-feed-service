import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { MediaDto, MediaItemDto } from '../../../application/dto';

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

  @ApiPropertyOptional({ type: MediaDto })
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
