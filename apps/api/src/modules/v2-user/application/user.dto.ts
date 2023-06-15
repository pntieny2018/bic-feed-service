import { Expose } from 'class-transformer';
import { UserBadgeDto } from './user-badge.dto';
import { TRANSFORMER_VISIBLE_ONLY } from '../../../common/constants/transformer.constant';

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

  @Expose({ groups: [TRANSFORMER_VISIBLE_ONLY.APPLICATION] })
  public permissions?: {
    communities: Record<string, string[]>;
    groups: Record<string, string[]>;
  };

  @Expose({ groups: [TRANSFORMER_VISIBLE_ONLY.APPLICATION] })
  public groups?: string[];

  @Expose()
  public showingBadges?: UserBadgeDto[];

  @Expose()
  public isDeactivated?: boolean;

  @Expose()
  public isVerified?: boolean;

  public constructor(userInfo: Partial<UserDto>) {
    Object.assign(this, userInfo);
  }
}
