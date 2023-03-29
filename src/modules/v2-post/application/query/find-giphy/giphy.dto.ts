export class GiphyDto {
  public type: string;
  public id: string;
  public url: string;
  public height: string;
  public width: string;
  public size: string;

  public constructor(
    id: string,
    type: string,
    url: string,
    height: string,
    width: string,
    size: string
  ) {
    this.id = id;
    this.type = type;
    this.url = url;
    this.height = height;
    this.width = width;
    this.size = size;
  }
}
