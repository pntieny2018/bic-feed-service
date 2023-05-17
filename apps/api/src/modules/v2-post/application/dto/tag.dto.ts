export class TagDto {
  public id: string;
  public groupId?: string;
  public name: string;
  public slug?: string;
  public totalUsed?: number;

  public constructor(data: Partial<TagDto>) {
    Object.assign(this, data);
  }
}
