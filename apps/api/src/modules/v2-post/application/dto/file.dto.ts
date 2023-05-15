export class FileDto {
  public id: string;
  public url: string;
  public name: string;
  public createdAt: Date;
  public mimeType: string;
  public size: number;

  public constructor(data: Partial<FileDto>) {
    Object.assign(this, data);
  }
}
