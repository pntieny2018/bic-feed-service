import { basename } from 'path';
import { ApiProperty } from '@nestjs/swagger';
import { IDocumentMetadata } from './interfaces';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { MediaStatus } from '../../../database/models/media.model';

export class ImageMetadataDto implements IDocumentMetadata {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  public id: number;

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
  public uploadId?: string;

  @ApiProperty()
  @IsOptional()
  @Expose()
  public status?: MediaStatus;

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
  })
  @IsString()
  @IsOptional()
  @Expose()
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
}
