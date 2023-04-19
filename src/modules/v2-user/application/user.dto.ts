export class UserDto {
  public id: string;
  public username: string;
  public fullname: string;
  public email: string;
  public avatar: string;
  public permissions?: {
    communities: Record<string, string[]>;
    groups: Record<string, string[]>;
  };
  public groups?: string[];
  public isDeactivated?: boolean;
  public isVerified?: boolean;

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
