export class VideoDto {
  public id: string;
  public url: string;
  public name: string;
  public createdAt: Date;
  public mimeType: string;
  public size: number;
  public width: number;
  public height: number;
  public createdBy: string;
  public thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];

  public constructor(data: Partial<VideoDto>) {
    Object.assign(this, data);
  }
}
