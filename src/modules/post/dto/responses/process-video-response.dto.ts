import { VideoProcessStatus } from '../..';

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
