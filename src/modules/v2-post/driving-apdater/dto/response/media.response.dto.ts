import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class BaseMediaResponseDto {
  @ApiProperty()
  public id: string;

  @ApiProperty()
  public name: string;

  @ApiProperty()
  public size: number;

  @ApiProperty()
  public url: string;

  @ApiProperty()
  public originName: string;

  @ApiProperty()
  public extension: string;

  @ApiProperty()
  public mimeType: string;

  @ApiProperty()
  public type: string;

  @ApiProperty()
  public createdAt: Date;

  public constructor(data: Partial<BaseMediaResponseDto>) {
    Object.assign(this, data);
  }
}

export class ImageResponseDto extends BaseMediaResponseDto {
  public constructor(data: Partial<ImageResponseDto>) {
    super(data);
  }
}

export class FileResponseDto extends BaseMediaResponseDto {
  public constructor(data: Partial<ImageResponseDto>) {
    super(data);
  }
}

export class ThumbnailResponseDto {
  @ApiProperty()
  public width: number;

  @ApiProperty()
  public height: number;

  @ApiProperty()
  public url: string;
}

export class VideoResponseDto extends BaseMediaResponseDto {
  @ApiProperty()
  public thumbnails: ThumbnailResponseDto[];

  public constructor(data: Partial<ImageResponseDto>) {
    super(data);
  }
}
export class MediaResponseDto {
  @ApiProperty()
  @Transform(({ value }) => value ?? [])
  public images?: ImageResponseDto[] = [];

  @ApiProperty()
  @Transform(({ value }) => value ?? [])
  public videos?: VideoResponseDto[] = [];

  @ApiProperty()
  @Transform(({ value }) => value ?? [])
  public files?: FileResponseDto[] = [];
}
