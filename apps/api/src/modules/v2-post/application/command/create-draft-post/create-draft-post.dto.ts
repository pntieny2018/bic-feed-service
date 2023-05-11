export class CreateDraftPostDto {
  public id: string;
  public constructor(data: Partial<CreateDraftPostDto>) {
    Object.assign(this, data);
  }
}
