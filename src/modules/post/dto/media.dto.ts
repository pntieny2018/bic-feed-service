import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class MediaDto {
  @ApiProperty({
    description: 'Media ID',
    type: String,
    default: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Origin name',
    type: String,
    default: 'filename.jpg',
  })
  name: string;

  @ApiProperty({
    description: 'The file name',
    type: String,
    default: 'origin_name.jpg',
  })
  originName: string;

  @ApiProperty({
    description: 'The url',
    type: String,
    default: 'https://....',
  })
  url: string;
}

export class ImageDto extends MediaDto {
  @ApiProperty({
    required: false,
    description: 'The width of image',
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiProperty({
    required: false,
    description: 'The height of image',
  })
  @IsOptional()
  @IsNumber()
  height?: number;
}

export class VideoDto extends MediaDto {}
export class FileDto extends MediaDto {}
