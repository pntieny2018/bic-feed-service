import { UserDto } from '../auth';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { GroupService } from '../../shared/group';
import { IPost, PostModel, PostPrivacy } from '../../database/models/post.model';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { subject, Subject } from '@casl/ability';
import {
  PERMISSION_KEY,
  permissionToCommonName,
  SUBJECT,
} from '../../common/constants/casl.constant';
import { GroupSharedDto } from '../../shared/group/dto';
import { AuthorityFactory } from './authority.factory';
import { PostResponseDto } from '../post/dto/responses';
import { SeriesResponseDto } from '../series/dto/responses';

@Injectable()
export class AuthorityService {
  public constructor(
    private _groupService: GroupService,
    private _authorityFactory: AuthorityFactory
  ) {}

  public async checkIsPublicPost(post: IPost): Promise<void> {
    if (post.privacy === PostPrivacy.PUBLIC) return;
    throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
  }

  public async checkCanReadPost(user: UserDto, post: IPost): Promise<void> {
    if (post.isDraft && post.createdBy === user.id) return;
    if (post.privacy === PostPrivacy.PUBLIC || post.privacy === PostPrivacy.OPEN) return;
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);
    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);
    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public async checkCanCRUDPost(
    user: UserDto,
    groupAudienceIds: string[],
    needEnableSetting: boolean
  ): Promise<void> {
    const notCreatableInGroups: GroupSharedDto[] = [];
    const notEditSettingInGroups: GroupSharedDto[] = [];
    const groups = await this._groupService.getMany(groupAudienceIds);

    for (const group of groups) {
      const canCreatePost = await this._can(
        user,
        PERMISSION_KEY.CRUD_POST_ARTICLE,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canCreatePost) {
        notCreatableInGroups.push(group);
      }

      if (canCreatePost && needEnableSetting) {
        const canEditPostSetting = await this._can(
          user,
          PERMISSION_KEY.EDIT_POST_SETTING,
          subject(SUBJECT.GROUP, { id: group.id })
        );
        if (!canEditPostSetting) {
          notEditSettingInGroups.push(group);
        }
      }
    }

    if (notCreatableInGroups.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You don't have ${permissionToCommonName(
          PERMISSION_KEY.CRUD_POST_ARTICLE
        )} permission at group ${notCreatableInGroups.map((e) => e.name).join(', ')}`,
        errors: { groupsDenied: notCreatableInGroups.map((e) => e.id) },
      });
    }

    if (notEditSettingInGroups.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You don't have ${permissionToCommonName(
          PERMISSION_KEY.EDIT_POST_SETTING
        )} permission at group ${notEditSettingInGroups.map((e) => e.name).join(', ')}`,
        errors: { groupsDenied: notEditSettingInGroups.map((e) => e.id) },
      });
    }
  }

  public async checkCanCRUDSeries(user: UserDto, groupAudienceIds: string[]): Promise<void> {
    const notCreatableGroupInfos: GroupSharedDto[] = [];
    const groups = await this._groupService.getMany(groupAudienceIds);

    for (const group of groups) {
      const canCreatePost = await this._can(
        user,
        PERMISSION_KEY.CRUD_SERIES,
        subject(SUBJECT.GROUP, { id: group.id })
      );
      if (!canCreatePost) {
        notCreatableGroupInfos.push(group);
      }
    }

    if (notCreatableGroupInfos.length) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: `You don't have ${permissionToCommonName(
          PERMISSION_KEY.CRUD_SERIES
        )} permission at group ${notCreatableGroupInfos.map((e) => e.name).join(', ')}`,
        errors: { groupsDenied: notCreatableGroupInfos.map((e) => e.id) },
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

  public async checkCanReadArticle(user: UserDto, post: IPost): Promise<void> {
    return this.checkCanReadPost(user, post);
  }

  public async checkIsPublicArticle(post: IPost): Promise<void> {
    return this.checkIsPublicPost(post);
  }

  public async checkCanReadSeries(user: UserDto, post: IPost): Promise<void> {
    return this.checkCanReadPost(user, post);
  }

  public async checkIsPublicSeries(post: IPost): Promise<void> {
    return this.checkIsPublicPost(post);
  }

  private async _can(user: UserDto, action: string, subject: Subject = null): Promise<boolean> {
    const ability = await this._authorityFactory.createForUser(user);
    return ability.can(action, subject);
  }
}
