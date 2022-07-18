import { UserDto } from '../auth';
import { ForbiddenException, forwardRef, Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class AuthorityService {
  public constructor(
    private _groupService: GroupService,
    private _authorityFactory: AuthorityFactory
  ) {}

  public async checkIsPublicPost(post: IPost): Promise<void> {
    if (post.privacy === PostPrivacy.PUBLIC) return;
    // const groupIds = (post.groups ?? []).map((g) => g.groupId);
    // const groups = await this._groupService.getMany(groupIds);
    // let isPublic = false;
    // groups.forEach((g) => {
    //   if (g.privacy === GroupPrivacy.PUBLIC) {
    //     isPublic = true;
    //     return;
    //   }
    // });

    // if (!isPublic) {
    throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    //}
  }

  public async checkCanReadPost(user: UserDto, post: IPost): Promise<void> {
    if (post.privacy === PostPrivacy.PUBLIC || post.privacy === PostPrivacy.OPEN) return;
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);
    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);
    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public async checkCanCreatePost(
    user: UserDto,
    groupAudienceIds: number[],
    isImportant = false
  ): Promise<void> {
    const notCreatableGroupInfos: GroupSharedDto[] = [];
    const groups = await this._groupService.getMany(groupAudienceIds);
    if (isImportant) {
      for (const group of groups) {
        const canCreateImportantPost = await this._can(
          user,
          PERMISSION_KEY.CREATE_IMPORTANT_POST,
          subject(SUBJECT.GROUP, { id: group.id })
        );
        if (!canCreateImportantPost) {
          notCreatableGroupInfos.push(group);
        }
      }
      if (notCreatableGroupInfos.length) {
        throw new ForbiddenException({
          code: HTTP_STATUS_ID.API_FORBIDDEN,
          message: `You don't have ${permissionToCommonName(
            PERMISSION_KEY.CREATE_IMPORTANT_POST
          )} permission at group ${notCreatableGroupInfos.map((e) => e.name).join(', ')}`,
          errors: { groupsDenied: notCreatableGroupInfos.map((e) => e.id) },
        });
      }
    } else {
      for (const group of groups) {
        const canCreatePost = await this._can(
          user,
          PERMISSION_KEY.CREATE_POST_ARTICLE,
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
            PERMISSION_KEY.CREATE_POST_ARTICLE
          )} permission at group ${notCreatableGroupInfos.map((e) => e.name).join(', ')}`,
          errors: { groupsDenied: notCreatableGroupInfos.map((e) => e.id) },
        });
      }
    }

    this._checkUserInGroups(user, groupAudienceIds);
  }

  public async checkCanUpdatePost(
    user: UserDto,
    post: PostResponseDto | PostModel | IPost,
    groupAudienceIds: number[]
  ): Promise<void> {
    await this.checkPostOwner(post, user.id);
    this._checkUserInSomeGroups(user, groupAudienceIds);
  }

  public async checkPostOwner(
    post: PostResponseDto | PostModel | IPost,
    authUserId: number
  ): Promise<void> {
    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }

    if (post.createdBy !== authUserId) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
    return;
  }

  public async checkCanDeletePost(
    user: UserDto,
    groupAudienceIds: number[],
    createBy: number
  ): Promise<void> {
    const isOwner = user.id === createBy;
    const groups = await this._groupService.getMany(groupAudienceIds);
    const notDeletableGroupInfos: GroupSharedDto[] = [];
    if (isOwner) {
      for (const group of groups) {
        const canDeletOwnPost = await this._can(
          user,
          PERMISSION_KEY.DELETE_OWN_POST,
          subject(SUBJECT.GROUP, { id: group.id })
        );
        if (!canDeletOwnPost) {
          notDeletableGroupInfos.push(group);
        }
      }
      if (notDeletableGroupInfos.length) {
        throw new ForbiddenException({
          code: HTTP_STATUS_ID.API_FORBIDDEN,
          message: `You don't have ${permissionToCommonName(
            PERMISSION_KEY.DELETE_OWN_POST
          )} permission at group ${notDeletableGroupInfos.map((e) => e.name).join(', ')}`,
          errors: { groupsDenied: notDeletableGroupInfos.map((e) => e.id) },
        });
      }
    } else {
      for (const group of groups) {
        const canDeleteOtherPost = await this._can(
          user,
          PERMISSION_KEY.DELETE_OTHERS_POST,
          subject(SUBJECT.GROUP, { id: group.id })
        );
        if (!canDeleteOtherPost) {
          notDeletableGroupInfos.push(group);
        }
      }
      if (notDeletableGroupInfos.length) {
        throw new ForbiddenException({
          code: HTTP_STATUS_ID.API_FORBIDDEN,
          message: `You don't have ${permissionToCommonName(
            PERMISSION_KEY.DELETE_OTHERS_POST
          )} permission at group ${notDeletableGroupInfos.map((e) => e.name).join(', ')}`,
          errors: { groupsDenied: notDeletableGroupInfos.map((e) => e.id) },
        });
      }
    }
    this._checkUserInSomeGroups(user, groupAudienceIds);
  }

  public async checkCanReadArticle(user: UserDto, post: IPost): Promise<void> {
    return this.checkCanReadPost(user, post);
  }

  public async checkIsPublicArticle(post: IPost): Promise<void> {
    return this.checkIsPublicPost(post);
  }

  private _checkUserInSomeGroups(user: UserDto, groupAudienceIds: number[]): void {
    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);

    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  private _checkUserInGroups(user: UserDto, groupAudienceIds: number[]): void {
    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfGroups(groupAudienceIds, userJoinedGroupIds);

    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  private async _can(user: UserDto, action: string, subject: Subject = null): Promise<boolean> {
    const ability = await this._authorityFactory.createForUser(user);
    return ability.can(action, subject);
  }
}
