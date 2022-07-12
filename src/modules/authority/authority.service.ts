import { UserDto } from '../auth';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { GroupService } from '../../shared/group';
import { IPost, PostPrivacy } from '../../database/models/post.model';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { UserService } from '../../shared/user';
import { subject, Subject } from '@casl/ability';

@Injectable()
export class AuthorityService {
  public constructor(
    @Inject('CaslAbility') private _ability,
    private _groupService: GroupService,
    private _userService: UserService
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

  public checkCanCreatePost(user: UserDto, groupAudienceIds: number[]): void {
    groupAudienceIds.forEach((groupAudienceId) => {
      this._mustHave('create_post_article', subject('group', { id: groupAudienceId }));
    });

    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfGroups(groupAudienceIds, userJoinedGroupIds);
    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public checkCanUpdatePost(user: UserDto, groupAudienceIds: number[]): void {
    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);

    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public checkCanDeletePost(user: UserDto, groupAudienceIds: number[]): void {
    return this.checkCanUpdatePost(user, groupAudienceIds);
  }

  public async checkCanReadArticle(user: UserDto, post: IPost): Promise<void> {
    return this.checkCanReadPost(user, post);
  }

  public async checkIsPublicArticle(post: IPost): Promise<void> {
    return this.checkIsPublicPost(post);
  }

  private async _getUserPermission(userId: number): Promise<
    {
      action: string;
      subject: string;
      conditions: {
        id: number;
      };
    }[]
  > {
    const cachedPermission = await this._userService.getCachedPermissionsOfUser(userId);
    if (cachedPermission) {
      return cachedPermission;
    }
    return [];
  }

  private _can(action: string, subject: Subject = null): boolean {
    if (subject === null) {
      return this._ability.can(action);
    } else {
      return this._ability.can(action, subject);
    }
  }

  private _mustHave(action: string, subject: Subject = null): void {
    if (!this._can(action, subject)) {
      const subjectName = AuthorityService._getSubjectName(subject);

      throw new ForbiddenException({
        code: `${subjectName}.${action}.forbidden`,
        message: "You don't have this permission",
      });
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
