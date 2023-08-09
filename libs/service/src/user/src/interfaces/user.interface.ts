import { UserPublicInfoDto } from '@beincom/dto';

export interface IBadgeCommunity {
  id: string;
  name: string;
}

export interface IUserBadge {
  id: string;
  name: string;
  iconUrl: string;
  community: IBadgeCommunity;
}

export interface IUser {
  id: string;
  username: string;
  fullname: string;
  email: string;
  avatar: string;
  permissions?: {
    communities: Record<string, string[]>;
    groups: Record<string, string[]>;
  };
  groups?: string[];
  showingBadges?: IUserBadge[];
  isDeactivated?: boolean;
  isVerified?: boolean;
}
