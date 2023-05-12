import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { subject } from '@casl/ability';
import {
  AUTHORITY_APP_SERVICE_TOKEN,
  IAuthorityAppService,
} from '../../../authority/application/authority.app-service.interface';
import { IPost, PostModel, PostStatus } from '../../../../database/models/post.model';
import { HTTP_STATUS_ID } from '../../../../common/constants';
import { LogicException } from '../../../../common/exceptions';
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
import { PostPrivacy, PostType } from '../../data-type';
import { SeriesResponseDto } from '../../../series/dto/responses';
import { PostResponseDto } from '../../../post/dto/responses';
import {
  ContentNoCRUDPermissionException,
  ContentNoEditSettingPermissionException,
  ContentRequireGroupException,
} from '../exception';
import { IContentValidator } from './interface/content.validator.interface';
import { PostEntity } from '../model/post/post.entity';
import { PostAllow } from '../../data-type/post-allow.enum';

@Injectable()
export class ContentValidator implements IContentValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private _groupAppService: IGroupApplicationService,
    @Inject(AUTHORITY_APP_SERVICE_TOKEN)
    private _authorityAppService: IAuthorityAppService,
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService
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

  public checkCanReadPost(post: PostEntity, user: UserDto, requireGroups?: GroupDto[]): void {
    if (post.get('status') !== PostStatus.PUBLISHED && post.get('createdBy') === user.id) return;
    if (post.get('privacy') === PostPrivacy.OPEN || post.get('privacy') === PostPrivacy.CLOSED)
      return;
    const groupAudienceIds = post.get('groupIds') ?? [];
    const userJoinedGroupIds = user.groups ?? [];
    const canAccess = groupAudienceIds.some((groupId) => userJoinedGroupIds.includes(groupId));
    if (!canAccess) {
      if (requireGroups && requireGroups.length > 0) {
        throw new ContentRequireGroupException({ requireGroups: requireGroups });
      }

      switch (post.get('type')) {
        case PostType.POST:
        case PostType.ARTICLE:
        case PostType.SERIES:
          throw new ContentNoCRUDPermissionException();
        default:
          throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }
    }
  }

  /**
   * Check post policy
   * @param post PostEntity
   * @param action PostAllow
   * @returns Promise resolve boolean
   */
  public allow(post: PostEntity, action: PostAllow): void {
    if (!post.get('setting')[action]) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message:
          action === PostAllow.REACT
            ? `React of this post are not available`
            : `Comment of this post are not available`,
      });
    }
  }

  /**
   * Check Valid Mentions
   * @param groupIds
   * @param userIds number[]
   * @throws LogicException
   */
  public async checkValidMentions(groupIds: string[], userIds: string[]): Promise<void> {
    const users = await this._userAppService.findAllByIds(userIds, { withGroupJoined: true });
    for (const user of users) {
      if (!groupIds.some((groupId) => user.groups.includes(groupId))) {
        throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }
    }
  }
}
