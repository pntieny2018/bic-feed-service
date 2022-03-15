import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class MediaDto {
  @ApiProperty({
    description: 'Media ID',
    type: String,
    default: 1,
  })
  public id: number;

  @ApiProperty({
    description: 'Origin name',
    type: String,
    default: 'filename.jpg',
  })
  public name: string;

  @ApiProperty({
    description: 'The file name',
    type: String,
    default: 'origin_name.jpg',
  })
  public originName: string;

  @ApiProperty({
    description: 'The url',
    type: String,
    default: 'https://....',
  })
  public url: string;
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
