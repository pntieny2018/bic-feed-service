import { basename } from 'path';
import { ApiProperty } from '@nestjs/swagger';
import { IDocumentMetadata } from './interfaces';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class FileMetadataDto implements IDocumentMetadata {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  public id: number;

  @ApiProperty({
    required: true,
    description: 'File name',
    example: 'ba7339bc-5204-4009-9d43-89b6d2787747.txt',
  })
  @IsNotEmpty()
  @IsString()
  @Transform((params) => basename(params.value))
  public name: string;

  @ApiProperty({
    required: false,
    description: 'Origin file name',
    example: 'example.txt',
  })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  public originName?: string;
}
