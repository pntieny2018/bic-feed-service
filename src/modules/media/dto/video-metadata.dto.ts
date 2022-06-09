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
import { MediaStatus } from '../../../database/models/media.model';
import { IDocumentMetadata } from './interfaces';
import { ThumbnailDto } from '../../post/dto/responses/process-video-response.dto';

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
  public status?: MediaStatus;

  @ApiProperty({
    required: true,
    description: 'Video name',
    example: 'ba7339bc-5204-4009-9d43-89b6d2787747.mp4',
  })
  @IsString()
  //@Transform((params) => basename(params.value) ?? params.value)
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
}
