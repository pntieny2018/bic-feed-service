import { UserDto } from '../auth';
import { Injectable } from '@nestjs/common';
import { GroupService } from '../../shared/group';
import { IPost } from '../../database/models/post.model';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { GroupPrivacy } from '../../shared/group/dto';
@Injectable()
export class AuthorityService {
  public constructor(private _groupService: GroupService) {}

  public allowAccess(user: UserDto, post: IPost): void {
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);

    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);

    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  /**
   * Need get groups of post
   * @param user UserDto
   * @param post IPost
   * @returns Promise<void>
   */
  public async canReadPost(user: UserDto, post: IPost): Promise<void> {
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);
    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);
    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public checkCanCreatePost(user: UserDto, groupAudienceIds: number[]): void {
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
}
