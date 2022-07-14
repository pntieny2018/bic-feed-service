import { UserDto } from '../auth';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { GroupService } from '../../shared/group';
import { IPost, PostPrivacy } from '../../database/models/post.model';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { UserService } from '../../shared/user';
import { subject, Subject } from '@casl/ability';
import { PERMISSION_KEY, SUBJECT } from '../ability/actions';

@Injectable()
export class AuthorityService {
  public constructor(
    @Inject('CaslAbility') private _ability,
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

  public checkCanCreatePost(user: UserDto, groupAudienceIds: number[], isImportant = false): void {
    if (isImportant) {
      groupAudienceIds.forEach((groupAudienceId) => {
        this._mustHave(
          PERMISSION_KEY.CREATE_IMPORTANT_POST,
          subject(SUBJECT.GROUP, { id: groupAudienceId })
        );
      });
    } else {
      groupAudienceIds.forEach((groupAudienceId) => {
        this._mustHave(
          PERMISSION_KEY.CREATE_POST_ARTICLE,
          subject(SUBJECT.GROUP, { id: groupAudienceId })
        );
      });
    }

    this._checkUserInGroups(user, groupAudienceIds);
  }

  public checkCanUpdatePost(user: UserDto, groupAudienceIds: number[]): void {
    groupAudienceIds.forEach((groupAudienceId) => {
      this._mustHave(PERMISSION_KEY.EDIT_OWN_POST, subject(SUBJECT.GROUP, { id: groupAudienceId }));
    });

    this._checkUserInSomeGroups(user, groupAudienceIds);
  }

  public checkCanDeletePost(user: UserDto, groupAudienceIds: number[], isOwner: boolean): void {
    groupAudienceIds.forEach((groupAudienceId) => {
      if (isOwner) {
        this._mustHave(
          PERMISSION_KEY.DELETE_OWN_POST,
          subject(SUBJECT.GROUP, { id: groupAudienceId })
        );
      } else {
        this._mustHave(
          PERMISSION_KEY.DELETE_OTHERS_POST,
          subject(SUBJECT.GROUP, { id: groupAudienceId })
        );
      }
    });
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

  private _mustHave(action: string, subject: Subject = null): void {
    if (!this._can(action, subject)) {
      const subjectName = AuthorityService._getSubjectName(subject);

      throw new ForbiddenException({
        code: `${subjectName}.${action}.forbidden`,
        message: "You don't have this permission",
      });
    }
  }

  private _mustHaveAny(actions: { action: string; subject?: Subject }[]): void {
    let isAllow = false;
    for (let i = 0; i < actions.length; i++) {
      if (this._can(actions[i].action, actions[i].subject)) {
        isAllow = true;
      }
    }

    if (!isAllow) {
      const subjectNames = actions.map((action) =>
        AuthorityService._getSubjectName(action.subject)
      );

      // only show error code of first forbidden action
      throw new ForbiddenException({
        code: `${subjectNames[0]}.${actions[0].action}.forbidden`,
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
