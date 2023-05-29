import { Inject, Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../v2-user/application';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../v2-group/application';
import { PERMISSION_KEY, SUBJECT } from '../../../../common/constants/casl.constant';
import {
  ContentEmptyGroupException,
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionException,
  ContentRequireGroupException,
} from '../exception';
import { IContentValidator } from './interface/content.validator.interface';
import { ContentEntity } from '../model/content/content.entity';
import { AccessDeniedException } from '../exception/access-denied.exception';
import { UserNoBelongGroupException } from '../exception/user-no-belong-group.exception';
import { PostPrivacy } from '../../data-type';
import { PostStatus } from '../../../../database/models/post.model';

@Injectable()
export class ContentValidator implements IContentValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected readonly _groupAppService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    protected readonly _userApplicationService: IUserApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    protected readonly _authorityAppService: IAuthorityAppService
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
    const notEditSettingInGroupIds = [];
    const ability = await this._authorityAppService.buildAbility(user);
    for (const groupId of groupAudienceIds) {
      if (
        !ability.can(
          PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING,
          subject(SUBJECT.GROUP, { id: groupId })
        )
      ) {
        notEditSettingInGroupIds.push(groupId);
      }
    }

    if (notEditSettingInGroupIds.length) {
      throw new ContentNoEditSettingPermissionException({
        groupsDenied: notEditSettingInGroupIds,
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

    if (contentEntity.get('groupIds')?.length === 0) {
      throw new ContentEmptyGroupException();
    }

    const state = contentEntity.getState();
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

  public async validateMentionUsers(userIds: string[], groupIds: string[]): Promise<void> {
    if (!userIds?.length || !groupIds?.length) return;
    const users = await this._userApplicationService.findAllByIds(userIds, {
      withGroupJoined: true,
    });
    const invalidUsers = [];
    for (const user of users) {
      if (!groupIds.some((groupId) => user.groups.includes(groupId))) {
        invalidUsers.push(user.id);
      }
    }

    if (invalidUsers.length) {
      throw new UserNoBelongGroupException({
        usersDenied: invalidUsers,
      });
    }
  }

  public checkCanReadContent(post: ContentEntity, user: UserDto, groups?: GroupDto[]): void {
    if (!post.isPublished() && post.isOwner(user.id)) return;
    if (post.isOpen() || post.isClosed()) return;
    const groupAudienceIds = post.get('groupIds') ?? [];
    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      if (groups?.length > 0) {
        throw new ContentRequireGroupException({ requireGroups: groups });
      }
      throw new ContentNoCRUDPermissionException();
    }
  }
}
