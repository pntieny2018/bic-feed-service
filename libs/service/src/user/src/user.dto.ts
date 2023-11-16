import { Expose } from 'class-transformer';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../../apps/api/src/common/constants';

class CommunityInfo {
  @Expose()
  public id: string;

  @Expose()
  public name: string;
}

export class ShowingBadgeDto {
  @Expose()
  public id: string;

  @Expose()
  public name: string;

  @Expose()
  public iconUrl: string;

  @Expose()
  public community: CommunityInfo;
}

export class BaseUserDto {
  @Expose()
  public id: string;

  @Expose()
  public username: string;

  @Expose()
  public fullname: string;

  @Expose()
  public email: string;

  @Expose()
  public avatar: string;

  public constructor(data: Partial<BaseUserDto>) {
    this.id = data.id;
    this.username = data.username;
    this.fullname = data.fullname;
    this.email = data.email;
    this.avatar = data.avatar;
  }
}

export class UserPermissionDto {
  public communities: { [commId: string]: string[] };
  public groups: { [groupId: string]: string[] };
}

export class UserDto extends BaseUserDto {
  @Expose()
  public showingBadges?: ShowingBadgeDto[];

  @Expose()
  public isDeactivated?: boolean;

  @Expose()
  public isVerified?: boolean;

  @Expose({ groups: [TRANSFORMER_VISIBLE_ONLY.APPLICATION] })
  public permissions?: {
    communities: Record<string, string[]>;
    groups: Record<string, string[]>;
  };

  @Expose({ groups: [TRANSFORMER_VISIBLE_ONLY.APPLICATION] })
  public groups?: string[];

  public constructor(data: Partial<UserDto>, excluded?: string[]) {
    super(data);

    Object.assign(this, data);
    if (excluded?.length > 0) {
      excluded.forEach((key) => {
        delete this[key];
      });
    }
  }
}
