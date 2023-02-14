export class UserDto {
  public id: string;
  public username: string;
  public fullname: string;
  public email: string;
  public avatar: string;
  public permissions?: any;
  public groups?: string[];

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
