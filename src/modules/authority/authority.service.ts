import { UserDto } from '../auth';
import { ForbiddenException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { GroupService } from '../../shared/group';
import { IPost, PostPrivacy } from '../../database/models/post.model';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { subject, Subject } from '@casl/ability';
import {
  PERMISSION_KEY,
  permissionToCommonName,
  SUBJECT,
} from '../../common/constants/casl.constant';
import { GroupSharedDto } from '../../shared/group/dto';

@Injectable()
export class AuthorityService {
  public constructor(
    @Inject(forwardRef(() => 'CaslAbility'))
    private _ability,
    private _groupService: GroupService
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
    // if (post.privacy === PostPrivacy.PUBLIC || post.privacy === PostPrivacy.OPEN)
    //   const dataGroups = await this._groupService.getMany(groupAudienceIds);
    // if (
    //   dataGroups.filter((g) => g.privacy === GroupPrivacy.PUBLIC || g.privacy === GroupPrivacy.OPEN)
    //     .length > 0
    // ) {
    //   return;
    // }
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
    if (isImportant) {
      for (const groupAudienceId of groupAudienceIds) {
        if (
          !this._can(
            PERMISSION_KEY.CREATE_IMPORTANT_POST,
            subject(SUBJECT.GROUP, { id: groupAudienceId })
          )
        ) {
          const groupInfo = await this._groupService.get(groupAudienceId);
          if (groupInfo) {
            notCreatableGroupInfos.push(groupInfo);
          }
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
      for (const groupAudienceId of groupAudienceIds) {
        if (
          !this._can(
            PERMISSION_KEY.CREATE_POST_ARTICLE,
            subject(SUBJECT.GROUP, { id: groupAudienceId })
          )
        ) {
          const groupInfo = await this._groupService.get(groupAudienceId);
          if (groupInfo) {
            notCreatableGroupInfos.push(groupInfo);
          }
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

  public async checkCanUpdatePost(user: UserDto, groupAudienceIds: number[]): Promise<void> {
    this._checkUserInSomeGroups(user, groupAudienceIds);
  }

  public async checkCanDeletePost(
    user: UserDto,
    groupAudienceIds: number[],
    createBy: number
  ): Promise<void> {
    const isOwner = user.id === createBy;
    const notDeletableGroupInfos: GroupSharedDto[] = [];
    if (isOwner) {
      for (const groupAudienceId of groupAudienceIds) {
        if (
          !this._can(
            PERMISSION_KEY.DELETE_OWN_POST,
            subject(SUBJECT.GROUP, { id: groupAudienceId })
          )
        ) {
          const groupInfo = await this._groupService.get(groupAudienceId);
          if (groupInfo) {
            notDeletableGroupInfos.push(groupInfo);
          }
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
      for (const groupAudienceId of groupAudienceIds) {
        if (
          !this._can(
            PERMISSION_KEY.DELETE_OTHERS_POST,
            subject(SUBJECT.GROUP, { id: groupAudienceId })
          )
        ) {
          const groupInfo = await this._groupService.get(groupAudienceId);
          if (groupInfo) {
            notDeletableGroupInfos.push(groupInfo);
          }
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

  private _can(action: string, subject: Subject = null): boolean {
    if (subject === null) {
      return this._ability.can(action);
    } else {
      return this._ability.can(action, subject);
    }
  }

  private static _getSubjectName(subject: Subject): string {
    return (
      subject?.['constructor']?.['modelName'] ||
      subject?.['__caslSubjectType__'] ||
      subject?.['constructor']?.['name'] ||
      'object'
    );
  }
}
