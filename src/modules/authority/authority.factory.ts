import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Ability } from '@casl/ability';
import { RedisService } from '@app/redis';
import { SentryService } from '@app/sentry';
import { BASIC_PERMISSIONS, CACHE_KEYS, SUBJECT } from '../../common/constants/casl.constant';
import { UserPermissionDto } from '../../shared/user/dto/user-permission.dto';
@Injectable()
export class AuthorityFactory {
  public constructor(private _store: RedisService, private _sentryService: SentryService) {}

  public async createForUser(userId: number): Promise<Ability> {
    try {
      // get all permission of the user
      const cacheKey = `${CACHE_KEYS.USER_PERMISSIONS}:${userId}`;
      const cachedPermissions = (await this._store.get(cacheKey)) as UserPermissionDto;
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

  public static extractAbilitiesFromPermission(userPermission: UserPermissionDto) {
    const abilities = [];
    const noSubjectAbilities = [];
    for (const communityId in userPermission.communities) {
      const commPermissions = userPermission.communities[communityId];
      commPermissions.forEach((permission) => {
        abilities.push({
          action: permission,
          subject: SUBJECT.COMMUNITY,
          conditions: { id: parseInt(communityId) },
        });
      });
    }

    for (const groupid in userPermission.groups) {
      const groupPermissions = userPermission.groups[groupid];
      groupPermissions.forEach((permission) => {
        abilities.push({
          action: permission,
          subject: SUBJECT.GROUP,
          conditions: { id: parseInt(groupid) },
        });
      });
    }

    this.bindBasicAbilitiesForBeinUser(noSubjectAbilities);

    return abilities.concat(noSubjectAbilities);
  }

  public static bindBasicAbilitiesForBeinUser(noSubjectAbilities: any[]) {
    Object.keys(BASIC_PERMISSIONS).forEach((permission) =>
      noSubjectAbilities.push({
        action: permission,
      })
    );
  }
}
