import { GroupPrivacy } from '../data-type';
import { Exclude, Expose } from 'class-transformer';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../common/constants/transformer.constant';

export class ChildGroup {
  public open: string[] = [];
  public closed: string[] = [];
  public private: string[] = [];
  public secret: string[] = [];
}

export class GroupDto {
  @Expose()
  public id: string;
  @Expose()
  public name: string;
  @Expose()
  public icon: string;
  @Expose()
  public communityId: string;
  @Expose()
  public isCommunity: boolean;
  @Expose()
  public privacy: GroupPrivacy;
  @Expose()
  public rootGroupId: string;

  @Expose({ groups: [TRANSFORMER_VISIBLE_ONLY.APPLICATION] })
  public child?: ChildGroup;

  public constructor(data: Partial<GroupDto>) {
    Object.assign(this, data);
  }
}
