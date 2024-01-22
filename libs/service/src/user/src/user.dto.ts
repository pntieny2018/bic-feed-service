import { ShowingBadgeDto } from '@beincom/dto';
import { Expose } from 'class-transformer';

import { TRANSFORMER_VISIBLE_ONLY } from '../../../../../apps/api/src/common/constants';

export class UserPublicProfileDto {
  @Expose()
  public id: string;

  @Expose()
  public username: string;

  @Expose()
  public fullname: string;

  @Expose()
  public avatar: string;

  @Expose()
  public isVerified?: boolean;

  @Expose()
  public showingBadges?: ShowingBadgeDto[];

  public constructor(data: Partial<UserPublicProfileDto> = {}) {
    this.id = data.id;
    this.username = data.username;
    this.fullname = data.fullname;
    this.avatar = data.avatar;
    this.isVerified = data.isVerified;
    this.showingBadges = data.showingBadges;
  }
}

export class UserPermissionDto {
  public communities: { [commId: string]: string[] };
  public groups: { [groupId: string]: string[] };
}

export class UserDto {
  @Expose()
  public id: string;

  @Expose()
  public username: string;

  @Expose()
  public fullname: string;

  @Expose()
  public avatar: string;

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

  public constructor(data: Partial<UserDto> = {}, excluded?: string[]) {
    if (!data) {
      return;
    }

    this.id = data.id;
    this.username = data.username;
    this.fullname = data.fullname;
    this.avatar = data.avatar;
    this.showingBadges = data.showingBadges;
    this.isDeactivated = data.isDeactivated;
    this.isVerified = data.isVerified;
    this.permissions = data.permissions;
    this.groups = data.groups;

    if (excluded?.length > 0) {
      excluded.forEach((key) => {
        delete this[key];
      });
    }
  }
}
