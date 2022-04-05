import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { IDocumentMetadata } from './interfaces';
import { basename } from 'path';

export class VideoMetadataDto implements IDocumentMetadata {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  public id: number;

  @ApiProperty({
    required: true,
    description: 'Video name',
    example: 'ba7339bc-5204-4009-9d43-89b6d2787747.mp4',
  })
  @IsString()
  @Transform((params) => basename(params.value))
  @IsOptional()
  public name?: string;

  @ApiProperty({
    required: false,
    description: 'URL',
  })
  @IsString()
  @IsOptional()
  public url?: string;

  @ApiProperty({
    required: false,
    description: 'Origin video name',
    example: 'example.mp4',
  })
  @IsString()
  @IsOptional()
  @Expose({ name: 'origin_name' })
  public originName?: string;
}
