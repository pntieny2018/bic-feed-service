import { Expose } from 'class-transformer';

export class UserDto {
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
  public permissions?: {
    communities: Record<string, string[]>;
    groups: Record<string, string[]>;
  };
  public groups?: string[];
  @Expose()
  public isDeactivated?: boolean;
  @Expose()
  public isVerified?: boolean;

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
