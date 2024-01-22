import { IMAGE_RESOURCE, MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { VideoThumbnail } from '@libs/common/dtos';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class MediaItemDto {
  @ApiProperty()
  @Type(() => String)
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  public id: string;
}

export class MediaRequestDto {
  @ApiProperty({ required: false, type: [MediaItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  @Expose()
  public images?: MediaItemDto[] = [];

  @ApiProperty({ required: false, type: [MediaItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  @IsOptional()
  @Expose()
  public videos?: MediaItemDto[] = [];

  @ApiProperty({ required: false, type: [MediaItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  @Expose()
  public files?: MediaItemDto[] = [];
}

export class MediaDto {
  public images: ImageDto[];
  public videos: VideoDto[];
  public files: FileDto[];
}

export class FileDto {
  public id: string;
  public url: string;
  public name: string;
  public createdAt: Date;
  public createdBy: string;
  public mimeType: string;
  public size: number;
  public status: MEDIA_PROCESS_STATUS;

  public constructor(data: Partial<FileDto>) {
    Object.assign(this, data);
  }
}

export class ImageDto {
  public id: string;
  public url: string;
  public source: string;
  public createdBy: string;
  public mimeType: string;
  public resource: IMAGE_RESOURCE;
  public width: number;
  public height: number;
  public status: MEDIA_PROCESS_STATUS;

  public constructor(data: Partial<ImageDto>) {
    Object.assign(this, data);
  }
}

export class VideoDto {
  public id: string;
  public url: string;
  public hlsUrl: string;
  public name: string;
  public createdAt: Date;
  public mimeType: string;
  public size: number;
  public width: number;
  public height: number;
  public createdBy: string;
  public status: MEDIA_PROCESS_STATUS;
  public duration: number;
  public thumbnails: VideoThumbnail[];

  public constructor(data: Partial<VideoDto>) {
    Object.assign(this, data);
    this.hlsUrl && (this.url = this.hlsUrl);
  }
}
