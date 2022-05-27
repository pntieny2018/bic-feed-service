import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { basename } from 'path';
import { MediaStatus } from '../../../database/models/media.model';
import { IDocumentMetadata } from './interfaces';

export class FileMetadataDto implements IDocumentMetadata {
  @ApiProperty()
  @Type(() => String)
  @IsUUID()
  @IsNotEmpty()
  public id: string;

  @ApiProperty({
    required: true,
    description: 'File name',
    example: 'ba7339bc-5204-4009-9d43-89b6d2787747.txt',
  })
  @IsString()
  @IsOptional()
  @Transform((params) => basename(params.value))
  public name?: string;

  @ApiProperty()
  @IsOptional()
  @Expose()
  public uploadId?: string;

  @ApiProperty({
    required: false,
    description: 'Size',
  })
  @IsOptional()
  @Expose()
  public size?: number;

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
  public url?: string;

  @ApiProperty({
    required: false,
    description: 'Origin file name',
    example: 'example.txt',
    name: 'origin_name',
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  @Expose({
    name: 'origin_name',
  })
  public originName?: string;
}
