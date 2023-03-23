import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { IPost, PostModel } from '../../../../database/models/post.model';
import { HTTP_STATUS_ID } from '../../../../common/constants';
import { LogicException } from '../../../../common/exceptions';
import { UserDto } from '../../../v2-user/application';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../v2-group/application';
import {
  PERMISSION_KEY,
  permissionToCommonName,
  SUBJECT,
} from '../../../../common/constants/casl.constant';
import { PostPrivacy } from '../../data-type';
import { PostStatus } from '../../data-type/post-status.enum';
import { SeriesResponseDto } from '../../../series/dto/responses';
import { PostResponseDto } from '../../../post/dto/responses';
import { IPostValidator } from './interface/post.validator.interface';

@Injectable()
export class PostValidator implements IPostValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private _groupAppService: IGroupApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    private _authorityAppService: IAuthorityAppService
  ) {}

  public async checkIsPublicPost(post: IPost): Promise<void> {
    if (post.privacy === PostPrivacy.OPEN) return;
    //TODO: create new exception for access denied
    throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
  }

  public async checkCanReadPost(user: UserDto, post: IPost): Promise<void> {
    if (post.status !== PostStatus.PUBLISHED && post.createdBy === user.id) return;
    if (post.privacy === PostPrivacy.OPEN || post.privacy === PostPrivacy.CLOSED) return;
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);
    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      //TODO: create new exception
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public async checkCanUpdatePost(
    user: UserDto,
    groupAudienceIds: string[],
    needEnableSetting: boolean
  ): Promise<void> {
    const notCreatableInGroups: GroupDto[] = [];
    const notEditSettingInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._authorityAppService.buildAbility(user);
    for (const group of groups) {
      const canCreatePost = ability.can(
        PERMISSION_KEY.CRUD_POST_ARTICLE,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canCreatePost) {
        notCreatableInGroups.push(group);
      }

      if (canCreatePost && needEnableSetting) {
        const canEditPostSetting = ability.can(
          PERMISSION_KEY.EDIT_POST_SETTING,
          subject(SUBJECT.GROUP, { id: group.id })
        );
        if (!canEditPostSetting) {
          notEditSettingInGroups.push(group);
        }
      }
    }

    if (notCreatableInGroups.length > 0 && notCreatableInGroups.length === groups.length) {
      //TODO: create new exception
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You don't have ${permissionToCommonName(
          PERMISSION_KEY.CRUD_POST_ARTICLE
        )} permission at group ${notCreatableInGroups.map((e) => e.name).join(', ')}`,
        errors: { groupsDenied: notCreatableInGroups.map((e) => e.id) },
      });
    }

    if (notEditSettingInGroups.length > 0 && notEditSettingInGroups.length === groups.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You don't have ${permissionToCommonName(
          PERMISSION_KEY.EDIT_POST_SETTING
        )} permission at group ${notEditSettingInGroups.map((e) => e.name).join(', ')}`,
        errors: { groupsDenied: notEditSettingInGroups.map((e) => e.id) },
      });
    }
  }

  public async checkCanCreatePost(
    user: UserDto,
    groupAudienceIds: string[],
    needEnableSetting: boolean
  ): Promise<void> {
    const notCreatableInGroups: GroupDto[] = [];
    const notEditSettingInGroups: GroupDto[] = [];
    const groups = await this._groupAppService.findAllByIds(groupAudienceIds);
    const ability = await this._authorityAppService.buildAbility(user);
    for (const group of groups) {
      const canCreatePost = ability.can(
        PERMISSION_KEY.CRUD_POST_ARTICLE,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canCreatePost) {
        notCreatableInGroups.push(group);
      }

      if (canCreatePost && needEnableSetting) {
        const canEditPostSetting = ability.can(
          PERMISSION_KEY.EDIT_POST_SETTING,
          subject(SUBJECT.GROUP, { id: group.id })
        );
        if (!canEditPostSetting) {
          notEditSettingInGroups.push(group);
        }
      }
    }

    if (notCreatableInGroups.length > 0) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You don't have ${permissionToCommonName(
          PERMISSION_KEY.CRUD_POST_ARTICLE
        )} permission at group ${notCreatableInGroups.map((e) => e.name).join(', ')}`,
        errors: { groupsDenied: notCreatableInGroups.map((e) => e.id) },
      });
    }

    if (notEditSettingInGroups.length > 0) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You don't have ${permissionToCommonName(
          PERMISSION_KEY.EDIT_POST_SETTING
        )} permission at group ${notEditSettingInGroups.map((e) => e.name).join(', ')}`,
        errors: { groupsDenied: notEditSettingInGroups.map((e) => e.id) },
      });
    }
  }

  public async checkCanDeletePost(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    return this.checkCanCreatePost(user, groupAudienceIds, false);
  }

  public async checkPostOwner(
    post: PostResponseDto | SeriesResponseDto | PostModel | IPost,
    authUserId: string
  ): Promise<void> {
    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }

    if (post.createdBy !== authUserId) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public checkUserInSomeGroups(user: UserDto, groupAudienceIds: string[]): void {
    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }
}
