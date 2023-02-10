export class UserDto {
  public id: string;
  public username: string;
  public email: string;
  public avatar: string;
  public permissions?: any;

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
