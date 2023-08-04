import { ImageResource } from '../../data-type';

export class FileDto {
  public id: string;
  public url: string;
  public name: string;
  public createdAt: Date;
  public createdBy: string;
  public mimeType: string;
  public size: number;

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
  public resource: ImageResource;
  public width: number;
  public height: number;
  public status: string;

  public constructor(data: Partial<ImageDto>) {
    Object.assign(this, data);
  }
}

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
  public status: string;
  public thumbnails: {
    url: string;
    width: number;
    height: number;
  }[];

  public constructor(data: Partial<VideoDto>) {
    Object.assign(this, data);
  }
}
