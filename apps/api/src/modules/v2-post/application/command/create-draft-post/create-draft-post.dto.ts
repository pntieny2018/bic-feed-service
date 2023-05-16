import { GroupDto } from '../../../../v2-group/application';

export class CreateDraftPostDto {
  public id: string;
  public audience: {
    groups: GroupDto[];
  };

  public constructor(data: Partial<CreateDraftPostDto>) {
    Object.assign(this, data);
  }
}
