import { GroupDto } from '../../../../v2-group/application';
import { PostSettingDto } from '../../dto';

export class CreateDraftPostDto {
  public id: string;
  public audience: {
    groups: GroupDto[];
  };

  public setting: PostSettingDto;

  public constructor(data: Partial<CreateDraftPostDto>) {
    Object.assign(this, data);
  }
}
