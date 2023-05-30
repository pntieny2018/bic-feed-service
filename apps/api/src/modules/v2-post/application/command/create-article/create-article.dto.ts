import { GroupDto } from '../../../../v2-group/application';
import { PostSettingDto } from '../../dto';

export class CreateArticleDto {
  public id: string;
  public audience: {
    groups: GroupDto[];
  };

  public setting: PostSettingDto;

  public constructor(data: Partial<CreateArticleDto>) {
    Object.assign(this, data);
  }
}
