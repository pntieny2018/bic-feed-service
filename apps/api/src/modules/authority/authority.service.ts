import { PERMISSION_KEY } from '@beincom/constants';
import { Ability, subject } from '@casl/ability';
import { GROUP_SERVICE_TOKEN, GroupDto, IGroupService } from '@libs/service/group';
import { UserDto } from '@libs/service/user';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { permissionToCommonName, SUBJECT } from '../../common/constants';
import { DomainForbiddenException } from '../../common/exceptions';
import {
  IPost,
  PostModel,
  PostPrivacy,
  PostStatus,
  PostType,
} from '../../database/models/post.model';
import { PostResponseDto } from '../post/dto/responses';
import { SeriesResponseDto } from '../series/dto/responses';
import {
  ContentRequireGroupException,
  ContentNoCRUDPermissionException,
  ContentNoPinPermissionException,
  ContentNotFoundException,
} from '../v2-post/domain/exception';

import { AuthorityFactory } from './authority.factory';

@Injectable()
export class AuthorityService {
  private readonly _logger = new Logger(AuthorityService.name);

  public constructor(
    @Inject(GROUP_SERVICE_TOKEN)
    private _groupAppService: IGroupService,
    private _authorityFactory: AuthorityFactory
  ) {}

  public async checkIsPublicPost(post: IPost): Promise<void> {
    if (post.privacy === PostPrivacy.OPEN) {
      return;
    }
    throw new DomainForbiddenException();
  }

  public async checkCanReadPost(
    user: UserDto,
    post: IPost,
    requireGroups?: GroupDto[]
  ): Promise<void> {
    if (post.status !== PostStatus.PUBLISHED && post.createdBy === user.id) {
      return;
    }
    if (post.privacy === PostPrivacy.OPEN || post.privacy === PostPrivacy.CLOSED) {
      return;
    }
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);
    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      if (requireGroups && requireGroups.length > 0) {
        throw new ContentRequireGroupException(null, { requireGroups: requireGroups });
      }

      switch (post.type) {
        case PostType.POST:
        case PostType.ARTICLE:
        case PostType.SERIES:
          throw new ContentNoCRUDPermissionException();
        default:
          throw new DomainForbiddenException();
      }
    }
  }

  public async checkCanUpdatePost(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    const notCreatableInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._buildAbility(user);
    for (const group of groups) {
      const canCreatePost = ability.can(
        PERMISSION_KEY.CRUD_POST_ARTICLE,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canCreatePost) {
        notCreatableInGroups.push(group);
      }
    }

    if (notCreatableInGroups.length > 0 && notCreatableInGroups.length === groups.length) {
      throw new DomainForbiddenException(
        `You don't have ${permissionToCommonName(
          PERMISSION_KEY.CRUD_POST_ARTICLE
        )} permission at group ${notCreatableInGroups.map((e) => e.name).join(', ')}`,
        null,
        { groupsDenied: notCreatableInGroups.map((e) => e.id) }
      );
    }
  }

  public async checkCanEditSetting(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    const notEditSettingInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._buildAbility(user);
    for (const group of groups) {
      const canEditPostSetting = ability.can(
        PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canEditPostSetting) {
        notEditSettingInGroups.push(group);
      }
    }

    if (notEditSettingInGroups.length > 0) {
      throw new DomainForbiddenException(
        `You don't have ${permissionToCommonName(
          PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING
        )} permission at group ${notEditSettingInGroups.map((e) => e.name).join(', ')}`,
        null,
        { groupsDenied: notEditSettingInGroups.map((e) => e.id) }
      );
    }
  }

  public async checkCanCreatePost(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    const notCreatableInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._buildAbility(user);
    for (const group of groups) {
      const canCreatePost = ability.can(
        PERMISSION_KEY.CRUD_POST_ARTICLE,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canCreatePost) {
        notCreatableInGroups.push(group);
      }
    }

    if (notCreatableInGroups.length > 0) {
      throw new DomainForbiddenException(
        `You don't have ${permissionToCommonName(
          PERMISSION_KEY.CRUD_POST_ARTICLE
        )} permission at group ${notCreatableInGroups.map((e) => e.name).join(', ')}`,
        null,
        { groupsDenied: notCreatableInGroups.map((e) => e.id) }
      );
    }
  }

  public async checkCanDeletePost(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    return this.checkCanCreatePost(user, groupAudienceIds);
  }

  public async checkCanUpdateSeries(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    const notCreatableGroupInfos = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._buildAbility(user);
    for (const group of groups) {
      const canCreatePost = ability.can(
        PERMISSION_KEY.CRUD_SERIES,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canCreatePost) {
        notCreatableGroupInfos.push(group);
      }
    }

    if (notCreatableGroupInfos.length > 0 && notCreatableGroupInfos.length === groups.length) {
      throw new DomainForbiddenException(
        `You don't have ${permissionToCommonName(
          PERMISSION_KEY.CRUD_SERIES
        )} permission at group ${notCreatableGroupInfos.map((e) => e.name).join(', ')}`,
        null,
        { groupsDenied: notCreatableGroupInfos.map((e) => e.id) }
      );
    }
  }

  public async checkCanCreateSeries(
    user: UserDto,
    groupAudienceIds: string[],
    needEnableSetting: boolean
  ): Promise<void> {
    const notCreatableGroupInfos = [];
    const notEditSettingInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._buildAbility(user);
    for (const group of groups) {
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
      throw new DomainForbiddenException(
        `You don't have ${permissionToCommonName(
          PERMISSION_KEY.CRUD_SERIES
        )} permission at group ${notCreatableGroupInfos.map((e) => e.name).join(', ')}`,
        null,
        { groupsDenied: notCreatableGroupInfos.map((e) => e.id) }
      );
    }

    if (notEditSettingInGroups.length > 0) {
      throw new DomainForbiddenException(
        `You don't have ${permissionToCommonName(
          PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING
        )} permission at group ${notEditSettingInGroups.map((e) => e.name).join(', ')}`,
        null,
        { groupsDenied: notEditSettingInGroups.map((e) => e.id) }
      );
    }
  }

  public async checkCanDeleteSeries(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    return this.checkCanCreateSeries(user, groupAudienceIds, false);
  }

  public async checkPostOwner(
    post: PostResponseDto | SeriesResponseDto | PostModel | IPost,
    authUserId: string
  ): Promise<void> {
    if (!post) {
      throw new ContentNotFoundException();
    }

    if (post.createdBy !== authUserId) {
      throw new DomainForbiddenException();
    }
  }

  public async checkCanReadArticle(
    user: UserDto,
    post: IPost,
    requireGroups?: GroupDto[]
  ): Promise<void> {
    return this.checkCanReadPost(user, post, requireGroups);
  }

  public async checkIsPublicArticle(post: IPost): Promise<void> {
    return this.checkIsPublicPost(post);
  }

  public async checkCanReadSeries(
    user: UserDto,
    post: IPost,
    requireGroups?: GroupDto[]
  ): Promise<void> {
    return this.checkCanReadPost(user, post, requireGroups);
  }

  public async checkIsPublicSeries(post: IPost): Promise<void> {
    return this.checkIsPublicPost(post);
  }

  private async _buildAbility(user: UserDto): Promise<Ability> {
    return this._authorityFactory.createForUser(user);
  }

  public checkUserInSomeGroups(user: UserDto, groupAudienceIds: string[]): void {
    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      throw new DomainForbiddenException();
    }
  }

  public async checkPinPermission(user: UserDto, groupIds: string[]): Promise<void> {
    const invalidGroup = [];
    const ability = await this._buildAbility(user);
    for (const groupId of groupIds) {
      const canPin = ability.can(
        PERMISSION_KEY.PIN_CONTENT,
        subject(SUBJECT.GROUP, { id: groupId })
      );
      if (!canPin) {
        invalidGroup.push(groupId);
      }
    }

    if (invalidGroup.length > 0) {
      throw new ContentNoPinPermissionException();
    }
  }

  public async getAudienceCanPin(groups: GroupDto[], user: UserDto): Promise<GroupDto[]> {
    const ability = await this._buildAbility(user);
    const groupsCanPin = [];
    for (const group of groups) {
      const canPin = ability.can(
        PERMISSION_KEY.PIN_CONTENT,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (canPin) {
        groupsCanPin.push(group);
      }
    }
    return groupsCanPin;
  }
}
