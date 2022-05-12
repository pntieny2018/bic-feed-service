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

  public async canReadPost(user: UserDto, post: IPost): Promise<void> {
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);
    const groups = await this._groupService.getMany(groupAudienceIds);
    const privateGroupIds = groups
      .filter((g) => g.privacy === GroupPrivacy.PRIVATE || g.privacy === GroupPrivacy.SECRET)
      .map((g) => g.id);
    const userJoinedGroupIds = user.profile?.groups ?? [];
    if (privateGroupIds.length == 0) return;

    const canAccess = this._groupService.isMemberOfSomeGroups([1], userJoinedGroupIds);
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

  public checkCanUpdatePost(user: UserDto, post: IPost): void {
    if (post.createdBy !== user.id) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }

    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);
    console.log('groupAudienceIds=', groupAudienceIds);
    
    const userJoinedGroupIds = user.profile?.groups ?? [];
    console.log('userJoinedGroupIds=', userJoinedGroupIds);
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);

    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public checkCanDeletePost(user: UserDto, post: IPost): void {
    if (post.createdBy !== user.id) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }

    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);

    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);

    if (!canAccess) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }
}
