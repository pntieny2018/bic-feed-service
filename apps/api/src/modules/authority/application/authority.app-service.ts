import { Ability, subject } from '@casl/ability';
import { SentryService } from '@libs/infra/sentry';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { PERMISSION_KEY, SUBJECT } from '../../../common/constants';
import { UserDto } from '../../v2-user/application';
import { UserPermission } from '../../v2-user/domain/model/user';

import { IAuthorityAppService } from './authority.app-service.interface';

@Injectable()
export class AuthorityAppService implements IAuthorityAppService {
  private _abilities: Ability;

  public constructor(private _sentryService: SentryService) {}

  public async buildAbility(user: UserDto): Promise<void> {
    try {
      const cachedPermissions = user.permissions ?? null;
      if (!cachedPermissions) {
        this._abilities = new Ability([]);
        return;
      }
      const permissions = AuthorityAppService.extractAbilitiesFromPermission(cachedPermissions);
      this._abilities = new Ability(permissions);
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new InternalServerErrorException(ex);
    }
  }

  public static extractAbilitiesFromPermission(userPermission: UserPermission): any[] {
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

  public canCRUDPostArticle(groupIds: string[]): boolean {
    return groupIds.every((groupId) =>
      this._abilities.can(PERMISSION_KEY.CRUD_POST_ARTICLE, subject(SUBJECT.GROUP, { id: groupId }))
    );
  }

  public canCRUDSeries(groupIds: string[]): boolean {
    return groupIds.every((groupId) =>
      this._abilities.can(PERMISSION_KEY.CRUD_SERIES, subject(SUBJECT.GROUP, { id: groupId }))
    );
  }

  public canEditSetting(groupIds: string[]): boolean {
    return groupIds.every(
      (groupId) =>
        this._abilities.can(
          PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING,
          subject(SUBJECT.GROUP, { id: groupId })
        ) || this._abilities.can(PERMISSION_KEY.MANAGE, subject(SUBJECT.GROUP, { id: groupId }))
    );
  }

  public canPinContent(groupIds: string[]): boolean {
    return groupIds.some(
      (groupId) =>
        this._abilities.can(PERMISSION_KEY.PIN_CONTENT, subject(SUBJECT.GROUP, { id: groupId })) ||
        this._abilities.can(PERMISSION_KEY.MANAGE, subject(SUBJECT.GROUP, { id: groupId }))
    );
  }

  public canDoActionOnGroup(permissionKey: string, groupId: string): boolean {
    return this._abilities.can(permissionKey, subject(SUBJECT.GROUP, { id: groupId }));
  }
}
