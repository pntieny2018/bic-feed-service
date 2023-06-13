import { Expose } from 'class-transformer';

export class BadgeCommunityDto {
  @Expose()
  public id: string;

  @Expose()
  public name: string;
}

export class UserBadgeDto {
  @Expose()
  public id: string;

  @Expose()
  public name: string;

  @Expose()
  public iconUrl: string;

  @Expose()
  public community: BadgeCommunityDto;

  public constructor(userInfo: Partial<UserBadgeDto>) {
    Object.assign(this, userInfo);
  }
}
