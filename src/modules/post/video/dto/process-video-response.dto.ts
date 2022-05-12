import { ProcessStatus } from '../process-status.enum';

export class ProcessVideoMetadataResponseDto {
  public name: string;
  public width?: number;
  public height?: number;
  public mimeType?: string;
  public extension?: string;
}
export class ProcessVideoResponseDto {
  //public postId: number;
  public uploadId: string;
  public status: ProcessStatus;
  public hlsUrl: string;
  public meta?: ProcessVideoMetadataResponseDto;
}
