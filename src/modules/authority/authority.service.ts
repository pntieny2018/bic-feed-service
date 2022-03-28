import { UserDto } from '../auth';
import { GroupService } from '../../shared/group';
import { IPost } from '../../database/models/post.model';
import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AuthorityService {
  public constructor(private _groupService: GroupService) {}

  public allowAccess(user: UserDto, post: IPost): void {
    const groupAudienceIds = (post.groups ?? []).map((g) => g.groupId);

    const userJoinedGroupIds = user.profile?.groups ?? [];
    const canAccess = this._groupService.isMemberOfSomeGroups(groupAudienceIds, userJoinedGroupIds);

    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to perform this action !');
    }
  }
}
