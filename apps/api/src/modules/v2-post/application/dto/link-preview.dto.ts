export class LinkPreviewDto {
  public url: string;
  public domain: string;
  public image: string;
  public title: string;
  public description: string;

  public constructor(data: Partial<LinkPreviewDto>) {
    Object.assign(this, data);
  }
}
