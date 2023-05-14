import { Inject, Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { HTTP_STATUS_ID } from '../../../../common/constants';
import { LogicException } from '../../../../common/exceptions';
import { UserDto } from '../../../v2-user/application';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../v2-group/application';
import { PERMISSION_KEY, SUBJECT } from '../../../../common/constants/casl.constant';
import {
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionException,
} from '../exception';
import { IContentValidator } from './interface/content.validator.interface';
import { ContentEntity } from '../model/post/content.entity';
import { PublishPostCommandPayload } from '../../application/command/publish-post/publish-post.command';
import { AccessDeniedException } from '../exception/access-denied.exception';

@Injectable()
export class ContentValidator implements IContentValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected _authorityAppService: IAuthorityAppService
  ) {}

  public async checkCanCRUDContent(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    const notCreatableInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._authorityAppService.buildAbility(user);
    for (const group of groups) {
      if (
        !ability.can(PERMISSION_KEY.CRUD_POST_ARTICLE, subject(SUBJECT.GROUP, { id: group.id }))
      ) {
        notCreatableInGroups.push(group);
      }
    }

    if (notCreatableInGroups.length) {
      throw new ContentNoCRUDPermissionException({
        groupsDenied: notCreatableInGroups.map((e) => e.id),
      });
    }
  }

  public async checkCanEditContentSetting(
    user: UserDto,
    groupAudienceIds: string[]
  ): Promise<void> {
    const notEditSettingInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._authorityAppService.buildAbility(user);
    for (const group of groups) {
      if (
        !ability.can(
          PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING,
          subject(SUBJECT.GROUP, { id: group.id })
        )
      ) {
        notEditSettingInGroups.push(group);
      }
    }

    if (notEditSettingInGroups.length) {
      throw new ContentNoEditSettingPermissionException({
        groupsDenied: notEditSettingInGroups.map((e) => e.id),
      });
    }
  }

  public async validatePublishContent(
    contentEntity: ContentEntity,
    userAuth: UserDto,
    groupIds: string[]
  ): Promise<void> {
    if (!contentEntity.isOwner(userAuth.id)) {
      throw new AccessDeniedException();
    }
    const state = contentEntity.get('state');
    const { detachGroupIds, enableSetting } = state;

    if (enableSetting) {
      await this.checkCanEditContentSetting(userAuth, groupIds);
    } else {
      await this.checkCanCRUDContent(userAuth, groupIds);
    }

    if (detachGroupIds?.length) {
      await this.checkCanCRUDContent(userAuth, detachGroupIds);
    }
  }
}
