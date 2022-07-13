import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Ability, AbilityBuilder } from '@casl/ability';
import { RedisService } from '@app/redis';
import { SentryService } from '@app/sentry';

type GroupMemberWithCommRoleDto = {
  userId: number;
  groupId: number;
  isAdmin: boolean;
  schemeId: string;
  isCommAdmin: boolean;
  commSchemeId: string;
  customRoleIds: string[];
};

@Injectable()
export class CaslAbilityFactory {
  private _cacheKeyUserPermissions = 'user_permissions';

  public constructor(private _store: RedisService, private _sentryService: SentryService) {}

  public async createForUser(userId: number) {
    try {
      // get all permission of the user
      const cacheKey = `${this._cacheKeyUserPermissions}:${userId}`;
      const cachedPermissions = await this._store.get(cacheKey);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return new Ability(cachedPermissions);
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new InternalServerErrorException(ex);
    }
  }

  /**
   * Build permission for Bein staff
   */
  public async createForStaff(staffRole: string) {
    const { can, cannot, build } = new AbilityBuilder(Ability);
    can('manage', 'all');

    // if (staffRole !== 'SUPER_ADMIN') {
    //   for (const { action, subject } of SUPER_ADMIN_PERMISSIONS) {
    //     cannot(action, subject);
    //   }
    // }

    return build();
  }
}
