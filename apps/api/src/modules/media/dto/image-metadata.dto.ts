import { basename } from 'path';

import { MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

import { IDocumentMetadata } from './interfaces';

export class ImageMetadataDto implements IDocumentMetadata {
  @ApiProperty()
  @Type(() => String)
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  public id: string;

  @ApiProperty({
    required: true,
    description: 'Image name',
    example: 'ba7339bc-5204-4009-9d43-89b6d2787747.jpg',
  })
  @IsString()
  @IsOptional()
  @Transform((params) => (params.value ? basename(`${params.value}`) : null))
  @Expose()
  public name?: string;

  @ApiProperty()
  @IsOptional()
  @Expose()
  public status?: MEDIA_PROCESS_STATUS;

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
    description: 'Origin image name',
    example: 'example.jpg',
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
    description: 'Image width',
    example: '500',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Expose()
  public width?: number;

  @ApiProperty({
    required: false,
    description: 'Image height',
    example: '500',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Expose()
  public height?: number;

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
