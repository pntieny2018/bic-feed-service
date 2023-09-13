export class SearchTagsDto {
  public list?: string[];

  public constructor(list: string[]) {
    this.list = list;
  }
}
