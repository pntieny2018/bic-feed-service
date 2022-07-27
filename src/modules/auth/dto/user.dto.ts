import { Expose } from 'class-transformer';
import { UserSharedDto } from '../../../shared/user/dto';

export class UserDto {
  @Expose()
  public username?: string;

  @Expose()
  public email?: string;

  @Expose()
  public avatar?: string;

  @Expose()
  public id: string;

  public staffRole?: any;

  public profile?: UserSharedDto;

  public permissions?: any;

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
