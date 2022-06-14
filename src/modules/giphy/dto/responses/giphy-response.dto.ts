export class GiphyResponseDto {
  public type: string;
  public id: string;
  public url: string;

  public constructor(id: string, type: string, url: string) {
    this.id = id;
    this.type = type;
    this.url = url;
  }
}
