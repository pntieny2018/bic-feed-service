export enum GroupPrivacy {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}

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
  privacy: GroupPrivacy;
  communityId: string;
  rootGroupId: string;
  isCommunity: boolean;
  child?: IChildGroup;
}
