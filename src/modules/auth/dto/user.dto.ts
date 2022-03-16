import { Expose } from 'class-transformer';

export class UserProfile {
  public fullname: string;
  public avatar: string;
  public createdAt?: string;
  public updatedAt?: string;
  public username?: string;
}
export class UserDto {
  @Expose()
  public username?: string;

  @Expose()
  public email?: string;

  @Expose()
  public avatar?: string;

  @Expose()
  public userId: number;
  public staffRole?: any;
  public profile?: UserProfile;

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
