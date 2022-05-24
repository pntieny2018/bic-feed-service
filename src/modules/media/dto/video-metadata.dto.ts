import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { MediaStatus } from '../../../database/models/media.model';
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
  public uploadId?: string;

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
    description: 'Origin video name',
    example: 'example.mp4',
  })
  @IsString()
  @IsOptional()
  @Expose()
  public originName?: string;
}
