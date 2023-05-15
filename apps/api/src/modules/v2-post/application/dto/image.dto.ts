export class ImageDto {
  public id: string;
  public url: string;
  public source: string;
  public createdBy: string;
  public mimeType: string;
  public resource: string;
  public width: number;
  public height: number;
  public status: string;

  public constructor(data: Partial<ImageDto>) {
    Object.assign(this, data);
  }
}
