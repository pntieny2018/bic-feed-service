import { PaginatedArgs } from '@libs/database/postgres/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { PageOptionsDto } from '../../../../../common/dto';

import { AudienceRequestDto } from './audience.request.dto';
import { MediaDto } from './media.request.dto';
import { PostSettingRequestDto } from './post.request.dto';

export class CreateSeriesRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['user_ids']: [],
      ['group_ids']: [1],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto = {
    groupIds: [],
  };

  @ApiProperty({ type: String })
  @Type(() => String)
  @IsNotEmpty()
  @MaxLength(64)
  public title: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(255)
  @IsOptional()
  public summary: string;

  @ApiProperty({
    type: MediaDto,
    example: {
      id: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
    },
  })
  @IsNotEmpty()
  @Expose({
    name: 'cover_media',
  })
  public coverMedia: MediaDto;

  @ApiProperty({
    description: 'Setting post',
    type: PostSettingRequestDto,
    required: false,
    example: {
      canReact: true,
      canComment: true,
      isImportant: false,
      importantExpiredAt: null,
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PostSettingRequestDto)
  public setting?: PostSettingRequestDto;
}

export class UpdateSeriesRequestDto {
  @ApiProperty({
    description: 'Audience',
    type: AudienceRequestDto,
    example: {
      ['user_ids']: [],
      ['group_ids']: [1],
    },
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AudienceRequestDto)
  public audience?: AudienceRequestDto;

  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(64)
  @IsOptional()
  @Expose({
    name: 'title',
  })
  public title?: string;

  @ApiProperty({ type: String })
  @Type(() => String)
  @MaxLength(255)
  @IsOptional()
  @Expose({
    name: 'summary',
  })
  public summary?: string;

  @ApiProperty({
    type: MediaDto,
    example: {
      id: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
    },
  })
  @IsOptional()
  @Expose({
    name: 'cover_media',
  })
  public coverMedia?: MediaDto;
}

export class ValidateSeriesTagDto {
  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
    required: true,
  })
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  public groups: string[] = [];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
    required: true,
  })
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  public series?: string[] = [];

  @ApiProperty({
    type: [String],
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8', '986dcaf4-c1ea-4218-b6b4-e4fd95a3c28e'],
    required: true,
  })
  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true })
  public tags?: string[] = [];
}

export class GetItemsBySeriesRequestDto {
  @ApiProperty({
    type: [String],
    name: 'series_ids',
  })
  @Type(() => Array)
  @IsUUID(4, { each: true })
  @Expose({
    name: 'series_ids',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string' && !value.includes(',')) {
      return [value];
    }
    return value;
  })
  @IsNotEmpty()
  public seriesIds: string[];
}

export class SearchSeriesRequestDto extends PageOptionsDto {
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
    description: 'Item IDs',
    required: false,
    name: 'item_ids',
  })
  @Expose({
    name: 'item_ids',
  })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  public itemIds?: string[];
}

export class SearchContentsBySeriesRequestDto extends PaginatedArgs {
  @ApiPropertyOptional({
    description: 'Filter by keyword',
    required: false,
    name: 'keyword',
  })
  @IsOptional()
  @IsString()
  @Expose({
    name: 'keyword',
  })
  public keyword?: string;
}

export class ChangeItemsInSeriesRequestDto {
  @ApiProperty({
    type: String,
    name: 'item_id',
    example: '9322c384-fd8e-4a13-80cd-1cbd1ef95ba8',
  })
  @IsNotEmpty()
  @IsUUID('4')
  @Expose({
    name: 'item_id',
  })
  public itemId: string;
}

export class ReorderItemsInSeriesRequestDto {
  @ApiProperty({
    type: [String],
    name: 'item_ids',
    example: ['9322c384-fd8e-4a13-80cd-1cbd1ef95ba8'],
  })
  @IsNotEmpty()
  @IsUUID('4', { each: true })
  @IsArray()
  @ArrayNotEmpty()
  @Expose({
    name: 'item_ids',
  })
  public itemIds: string[];
}
