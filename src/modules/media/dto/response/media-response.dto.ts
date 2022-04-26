import { ImageMetadataDto } from '../image-metadata.dto';
import { VideoMetadataDto } from '../video-metadata.dto';
import { ApiProperty } from '@nestjs/swagger';
import { FileMetadataDto } from '../file-metadata.dto';
import { Expose } from 'class-transformer';

export class MediaFilterResponseDto {
  @ApiProperty({
    type: [FileMetadataDto],
  })
  @Expose()
  public files: FileMetadataDto[];

  @ApiProperty({
    type: [VideoMetadataDto],
  })
  @Expose()
  public videos: VideoMetadataDto[];

  @ApiProperty({
    type: [ImageMetadataDto],
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
