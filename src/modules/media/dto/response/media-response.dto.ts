import { ImageMetadataDto } from '../image-metadata.dto';
import { VideoMetadataDto } from '../video-metadata.dto';
import { ApiProperty } from '@nestjs/swagger';
import { FileMetadataDto } from '../file-metadata.dto';
import { Expose } from 'class-transformer';
import { FileMetadataResponseDto } from './file-metadata-response.dto';
import { VideoMetadataResponseDto } from './video-metadata-response.dto';
import { ImageMetadataResponseDto } from './image-metadata-response.dto';

export class MediaFilterResponseDto {
  @ApiProperty({
    type: [FileMetadataResponseDto],
  })
  @Expose()
  public files: FileMetadataDto[];

  @ApiProperty({
    type: [VideoMetadataResponseDto],
  })
  @Expose()
  public videos: VideoMetadataDto[];

  @ApiProperty({
    type: [ImageMetadataResponseDto],
  })
  @Expose()
  public images: ImageMetadataDto[];

  public constructor(
    files: FileMetadataDto[],
    videos: VideoMetadataDto[],
    images: ImageMetadataDto[]
  ) {
    this.videos = videos;
    this.images = images;
    this.files = files;
  }
}

export class MediaResponseDto {
  @ApiProperty()
  public id: number;

  @ApiProperty()
  public createdBy: number;

  @ApiProperty()
  public url: string;

  @ApiProperty()
  public type: string;

  @ApiProperty()
  public createdAt?: Date;

  @ApiProperty()
  public name: string;

  @ApiProperty()
  public originName?: string;

  @ApiProperty()
  public width?: number;

  @ApiProperty()
  public height?: number;

  @ApiProperty()
  public extension?: string;
}
