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
  public id: string;
  public name: string;
  public icon: string;
  public communityId: string;
  public isCommunity: boolean;
  public privacy: GroupPrivacy;
  public rootGroupId: string;

  @Expose({ groups: [TRANSFORMER_VISIBLE_ONLY.APPLICATION] })
  public child?: ChildGroup = {
    closed: [],
    open: [],
    private: [],
    secret: [],
  };

  public constructor(userInfo: Partial<GroupDto>) {
    Object.assign(this, userInfo);
  }
}
