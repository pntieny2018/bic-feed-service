import { GROUP_PRIVACY } from '../data-type';

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
  public privacy: GROUP_PRIVACY;
  public rootGroupId: string;
  public child?: ChildGroup = {
    closed: [],
    open: [],
    private: [],
    secret: [],
  };
}
