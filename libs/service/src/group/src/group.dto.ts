import { PRIVACY } from '@beincom/constants';
import { TRANSFORMER_VISIBLE_ONLY } from '@libs/common/constants/transfromer.constant';
import { Expose } from 'class-transformer';

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
  public privacy: PRIVACY;
  @Expose()
  public rootGroupId: string;

  @Expose({ groups: [TRANSFORMER_VISIBLE_ONLY.APPLICATION] })
  public child?: ChildGroup;

  public constructor(data: Partial<GroupDto>) {
    Object.assign(this, data);
  }
}

export interface IMemberOfGroup {
  id: string;
  username: string;
  fullname: string;
  avatar: string;
  chatUserId: string;
  isVerified: boolean;
  roles: {
    name: string;
  };
  isAdmin: false;
}

export class GroupMember {
  public groupAdmin: {
    data: IMemberOfGroup[];
    userCount: number;
    name: string;
  };
  public groupMember: {
    data: IMemberOfGroup[];
    userCount: number;
    name: string;
  };
  public total: number;
}
