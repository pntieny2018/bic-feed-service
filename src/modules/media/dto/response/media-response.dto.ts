import { ApiProperty } from '@nestjs/swagger';
import { FileDto, ImageDto, VideoDto } from '../../../post/dto/common/media.dto';

export class MediaFilterResponseDto {
  @ApiProperty()
  public files: FileDto[];

  @ApiProperty()
  public videos: VideoDto[];

  @ApiProperty()
  public images: ImageDto[];
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
