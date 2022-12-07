import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Ability } from '@casl/ability';
import { SentryService } from '@app/sentry';
import { SUBJECT } from '../../common/constants/casl.constant';
import { UserPermissionDto } from '../../shared/user/dto/user-permission.dto';
import { UserDto } from '../auth';
@Injectable()
export class AuthorityFactory {
  public constructor(private _sentryService: SentryService) {}

  public async buildAbility(user: UserDto): Promise<Ability> {
    try {
      const cachedPermissions = user.permissions ?? null;
      if (!cachedPermissions) {
        return new Ability();
      }
      const abilities = AuthorityFactory.extractAbilitiesFromPermission(cachedPermissions);

      return new Ability(abilities);
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new InternalServerErrorException(ex);
    }
  }

  public static extractAbilitiesFromPermission(userPermission: UserPermissionDto): any[] {
    const abilities = [];
    for (const communityId in userPermission.communities) {
      const commPermissions = userPermission.communities[communityId];
      commPermissions.forEach((permission) => {
        abilities.push({
          action: permission,
          subject: SUBJECT.COMMUNITY,
          conditions: { id: communityId },
        });
      });
    }

    for (const groupid in userPermission.groups) {
      const groupPermissions = userPermission.groups[groupid];
      groupPermissions.forEach((permission) => {
        abilities.push({
          action: permission,
          subject: SUBJECT.GROUP,
          conditions: { id: groupid },
        });
      });
    }

    return abilities;
  }
}
