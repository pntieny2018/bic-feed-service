import { basename } from 'path';

import { MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { ThumbnailDto } from '../../post/dto/responses/process-video-response.dto';

import { IDocumentMetadata } from './interfaces';

export class VideoMetadataDto implements IDocumentMetadata {
  @ApiProperty()
  @Type(() => String)
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  public id: string;

  @ApiProperty()
  @IsOptional()
  @Expose()
  public status?: MEDIA_PROCESS_STATUS;

  @ApiProperty({
    required: true,
    description: 'Video name',
    example: 'ba7339bc-5204-4009-9d43-89b6d2787747.mp4',
  })
  @IsString()
  @Transform((params) => (params.value ? basename(`${params.value}`) : null))
  @IsOptional()
  @Expose()
  public name?: string;

  @ApiProperty({
    required: false,
    description: 'URL',
  })
  @IsString()
  @IsOptional()
  @Expose()
  public url?: string;

  @ApiProperty({
    required: false,
    description: 'Size',
  })
  @IsOptional()
  @Expose()
  public size?: number;

  @ApiProperty({
    required: false,
    description: 'Video width',
    example: '500',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Expose()
  public width?: number;

  @ApiProperty({
    required: false,
    description: 'Video height',
    example: '500',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Expose()
  public height?: number;

  @ApiProperty({
    required: false,
    description: 'Origin video name',
    example: 'example.mp4',
    name: 'origin_name',
  })
  @IsString()
  @IsOptional()
  @Expose({
    name: 'origin_name',
  })
  public originName?: string;

  @ApiProperty({
    required: false,
    type: String,
    example: 'pdf',
  })
  @IsString()
  @IsOptional()
  @Expose()
  public extension?: string;

  @ApiProperty({
    required: false,
    type: String,
  })
  @IsString()
  @IsOptional()
  @Expose({
    name: 'mime_type',
  })
  public mimeType?: string;
  @ApiProperty({ required: false, type: [ThumbnailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThumbnailDto)
  @Expose()
  @Transform(({ value }) => value ?? [])
  public thumbnails?: ThumbnailDto[] = [];

  @ApiProperty({
    type: String,
  })
  @IsString()
  @IsOptional()
  @Expose()
  public type?: string;

  @ApiProperty({ required: false, type: Date })
  @IsOptional()
  @Expose({
    name: 'created_at',
  })
  public createdAt?: Date;
}
