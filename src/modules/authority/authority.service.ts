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

  public async checkIsPublicPost(post: IPost): Promise<void> {
    const groupIds = (post.groups ?? []).map((g) => g.groupId);
    const groups = await this._groupService.getMany(groupIds);
    let isPublic = false;
    groups.forEach((g) => {
      if (g.privacy === GroupPrivacy.PUBLIC) {
        isPublic = true;
        return;
      }
    });

    if (!isPublic) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
  }

  public async checkCanReadPost(user: UserDto, post: IPost): Promise<void> {
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);
    const dataGroups = await this._groupService.getMany(groupAudienceIds);
    if (
      dataGroups.filter((g) => g.privacy === GroupPrivacy.PUBLIC || g.privacy === GroupPrivacy.OPEN)
        .length > 0
    ) {
      return;
    }
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

  public checkCanDeletePost(user: UserDto, groupAudienceIds: number[]): void {
    return this.checkCanUpdatePost(user, groupAudienceIds);
  }
}
