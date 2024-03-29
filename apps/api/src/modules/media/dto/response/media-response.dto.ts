import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { FileMetadataResponseDto } from './file-metadata-response.dto';
import { VideoMetadataResponseDto } from './video-metadata-response.dto';
import { ImageMetadataResponseDto } from './image-metadata-response.dto';

export class MediaFilterResponseDto {
  @ApiProperty({
    type: [FileMetadataResponseDto],
  })
  @Expose()
  public files: FileMetadataResponseDto[];

  @ApiProperty({
    type: [VideoMetadataResponseDto],
  })
  @Expose()
  public videos: VideoMetadataResponseDto[];

  @ApiProperty({
    type: [ImageMetadataResponseDto],
  })
  @Expose()
  public images: ImageMetadataResponseDto[];

  public constructor(
    files: FileMetadataResponseDto[],
    videos: VideoMetadataResponseDto[],
    images: ImageMetadataResponseDto[]
  ) {
    this.videos = videos;
    this.images = images;
    this.files = files;
  }
}

export class MediaResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public createdBy: string;

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
