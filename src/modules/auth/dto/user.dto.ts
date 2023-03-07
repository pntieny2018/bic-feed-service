import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  public username?: string;

  @Expose()
  public email?: string;

  @Expose()
  public avatar?: string;

  @Expose()
  public fullname?: string;

  @Expose()
  public id: string;

  public permissions?: any;

  public groups?: string[];

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
