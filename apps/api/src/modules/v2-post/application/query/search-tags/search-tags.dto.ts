export class GroupTagsDto {
  public name: string;
  public ids: string[];

  public constructor(data: Partial<GroupTagsDto>) {
    Object.assign(this, data);
  }
}

export class SearchTagsDto {
  public list?: GroupTagsDto[];

  public constructor(list: GroupTagsDto[]) {
    this.list = list;
  }
}
