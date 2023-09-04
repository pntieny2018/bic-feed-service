class CommunityInfo {
  public id: string;
  public name: string;
}

export class ShowingBadgeDto {
  public id: string;
  public name: string;
  public iconUrl: string;
  public community: CommunityInfo;
}

export class UserPermissionDto {
  public communities: { [commId: string]: string[] };
  public groups: { [groupId: string]: string[] };
}

export class UserDto {
  public id: string;
  public username: string;
  public fullname: string;
  public email: string;
  public avatar: string;

  public isDeactivated: boolean;
  public isVerified: boolean;

  public showingBadges?: ShowingBadgeDto[];
  public groups?: string[];
  public permissions?: UserPermissionDto;

  public constructor(data: Partial<UserDto>, excluded?: string[]) {
    Object.assign(this, data);
    if (excluded?.length > 0) {
      excluded.forEach((key) => {
        delete this[key];
      });
    }
  }
}
