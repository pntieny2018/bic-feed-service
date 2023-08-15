import { IUser } from '@libs/service/user/src/interfaces';
import { Injectable } from '@nestjs/common';

import { UserEntity } from '../../../v2-user/domain/model/user';

@Injectable()
export class UserMapper {
  public toDomain(user: IUser): UserEntity {
    return new UserEntity({
      id: user.id,
      username: user.username,
      fullname: user.fullname,
      avatar: user.avatar,
      email: user.email,
      groups: user.groups,
      permissions: user.permissions,
      isDeactivated: user.isDeactivated,
      isVerified: user.isVerified,
      showingBadges: user.showingBadges,
    });
  }

  public toPersistence(userEntity: UserEntity): IUser {
    return {
      id: userEntity.get('id'),
      username: userEntity.get('username'),
      fullname: userEntity.get('fullname'),
      email: userEntity.get('email'),
      avatar: userEntity.get('avatar'),
      groups: userEntity.get('groups'),
      permissions: userEntity.get('permissions'),
      isDeactivated: userEntity.get('isDeactivated'),
      isVerified: userEntity.get('isVerified'),
      showingBadges: userEntity.get('showingBadges'),
    };
  }
}
