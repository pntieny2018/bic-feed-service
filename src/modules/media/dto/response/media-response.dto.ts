import { ApiProperty } from '@nestjs/swagger';
import { FileDto, ImageDto, VideoDto } from '../../../post/dto/common/media.dto';

export class MediaFilterResponseDto {
  @ApiProperty({
    type: FileDto,
    isArray: true,
  })
  public files: FileDto[];

  @ApiProperty({
    type: VideoDto,
    isArray: true,
  })
  public videos: VideoDto[];

  @ApiProperty({
    type: ImageDto,
    isArray: true,
  })
  public images: ImageDto[];

  public constructor(files: FileDto[], videos: VideoDto[], images: ImageDto[]) {
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
