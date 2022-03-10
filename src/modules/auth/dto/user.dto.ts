export class UserProfile {
  public fullname: string;
  public avatar: string;
  public createdAt?: string;
  public updatedAt?: string;
  public username?: string;
}
export class UserDto {
  public username?: string;
  public email?: string;
  public userId: number;
  public staffRole?: any;
  public profile?: UserProfile;

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
