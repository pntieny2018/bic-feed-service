import { basename } from 'path';
import { ApiProperty } from '@nestjs/swagger';
import { IDocumentMetadata } from './interfaces';
import { Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ImageMetadataDto implements IDocumentMetadata {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  public id: number;

  @ApiProperty({
    required: true,
    description: 'Image name',
    example: 'ba7339bc-5204-4009-9d43-89b6d2787747.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @Transform((params) => basename(params.value))
  public name: string;

  @ApiProperty({
    required: false,
    description: 'Origin image name',
    example: 'example.jpg',
  })
  @IsString()
  @IsOptional()
  public originName?: string;

  @ApiProperty({
    required: false,
    description: 'Image width',
    example: '500',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  public width?: number;

  @ApiProperty({
    required: false,
    description: 'Image height',
    example: '500',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  public height?: number;
}
