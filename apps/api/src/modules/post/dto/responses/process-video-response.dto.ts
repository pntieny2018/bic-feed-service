import { VideoProcessStatus } from '../..';
import { Expose } from 'class-transformer';

export class ProcessVideoMetadataResponseDto {
  public name: string;
  public width?: number;
  public height?: number;
  public mimeType?: string;
  public extension?: string;
  public size: number;
}
export class ProcessVideoResponseDto {
  public videoId: string;
  public status: VideoProcessStatus;
  public hlsUrl: string;
  public meta?: ProcessVideoMetadataResponseDto;
}

export class IPropertiesAttribute {
  public name?: string;
  public mimeType?: string;
  public size?: number;
  public codec?: string;
  public width?: number;
  public height?: number;
  public duration?: number;
}

export class ThumbnailDto {
  @Expose()
  public width: number;
  @Expose()
  public height: number;
  @Expose()
  public url: string;
}

export class VideoProcessingEndDto {
  public videoId: string;
  public postId: string;
  public status: VideoProcessStatus;
  public hlsUrl?: string;
  public thumbnails?: ThumbnailDto[];
  public properties: IPropertiesAttribute;
}
