import { PRIVACY } from '@beincom/constants';

export interface IChildGroup {
  open: string[];
  closed: string[];
  private: string[];
  secret: string[];
}

export interface IGroup {
  id: string;
  name: string;
  icon: string;
  privacy: PRIVACY;
  communityId: string;
  rootGroupId: string;
  isCommunity: boolean;
  child?: IChildGroup;
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

export interface IGroupMember {
  groupAdmin: {
    data: IMemberOfGroup[];
    userCount: number;
    name: string;
  };
  groupMember: {
    data: IMemberOfGroup[];
    userCount: number;
    name: string;
  };
  total: number;
}
