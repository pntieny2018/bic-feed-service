import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MediaDto {
  @ApiProperty({
    description: 'Media ID',
    type: String,
    default: 1,
  })
  @IsNotEmpty()
  public id: number;

  @ApiProperty({
    description: 'Origin name',
    required: false,
    type: String,
    default: 'filename.jpg',
  })
  @IsOptional()
  @IsString()
  public name?: string;

  @ApiProperty({
    description: 'The file name',
    type: String,
    required: false,
    default: 'origin_name.jpg',
  })
  @IsOptional()
  public originName?: string;

  @ApiProperty({
    description: 'The url',
    type: String,
    required: false,
    default: 'https://....',
  })
  @IsOptional()
  public url?: string;
}

export class ImageDto extends MediaDto {
  @ApiProperty({
    required: false,
    description: 'The width of image',
  })
  @IsOptional()
  @IsNumber()
  public width?: number;

  @ApiProperty({
    required: false,
    description: 'The height of image',
  })
  @IsOptional()
  @IsNumber()
  public height?: number;
}

export class VideoDto extends MediaDto {}
export class FileDto extends MediaDto {}
