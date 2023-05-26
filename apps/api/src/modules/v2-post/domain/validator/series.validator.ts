import { Inject, Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { ISeriesValidator } from './interface/series.validator.interface';
import { PERMISSION_KEY, SUBJECT } from '../../../../common/constants';
import { UserDto } from '../../../v2-user/application';
import { GroupDto } from '../../../v2-group/application';
import {
  ContentNoCRUDPermissionAtGroupException,
  ContentNoEditSettingPermissionAtGroupException,
} from '../exception';

@Injectable()
export class SeriesValidator implements ISeriesValidator {
  public constructor(
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService
  ) {}

  public async checkCanCreateSeries(
    user: UserDto,
    groupAudiences: GroupDto[],
    needEnableSetting: boolean
  ): Promise<void> {
    const notCreatableGroupInfos: GroupDto[] = [];
    const notEditSettingInGroups: GroupDto[] = [];
    const ability = await this._authorityAppService.buildAbility(user);
    for (const group of groupAudiences) {
      const canCreatePost = ability.can(
        PERMISSION_KEY.CRUD_SERIES,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canCreatePost) {
        notCreatableGroupInfos.push(group);
      }

      if (canCreatePost && needEnableSetting) {
        const canEditPostSetting = ability.can(
          PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING,
          subject(SUBJECT.GROUP, { id: group.id })
        );
        if (!canEditPostSetting) {
          notEditSettingInGroups.push(group);
        }
      }
    }

    if (notCreatableGroupInfos.length > 0) {
      throw new ContentNoCRUDPermissionAtGroupException(
        {
          groupsDenied: notCreatableGroupInfos.map((e) => e.id),
        },
        notCreatableGroupInfos.map((e) => e.name)
      );
    }

    if (notEditSettingInGroups.length > 0) {
      throw new ContentNoEditSettingPermissionAtGroupException(
        {
          groupsDenied: notEditSettingInGroups.map((e) => e.id),
        },
        notEditSettingInGroups.map((e) => e.name)
      );
    }
  }
}
