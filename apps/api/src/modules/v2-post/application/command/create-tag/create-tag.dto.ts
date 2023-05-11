export class CreateTagDto {
  public id: string;
  public groupId: string;
  public name: string;
  public slug: string;
  public totalUsed: number;

  public constructor(data: Partial<CreateTagDto>) {
    Object.assign(this, data);
  }
}
