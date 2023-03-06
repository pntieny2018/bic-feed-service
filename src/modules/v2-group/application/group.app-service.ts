import { Inject } from '@nestjs/common';
import { GroupEntity } from '../domain/model/group';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../domain/repositoty-interface/group.repository.interface';
import { IGroupApplicationService } from './group.app-service.interface';
import { GroupDto } from './group.dto';
import { ArrayHelper } from '../../../common/helpers';
import { GROUP_PRIVACY } from '../data-type';

export class GroupApplicationService implements IGroupApplicationService {
  @Inject(GROUP_REPOSITORY_TOKEN)
  private readonly _repo: IGroupRepository;

  public async findOne(groupId: string): Promise<GroupDto> {
    const data = await this._repo.findOne(groupId);
    return this._toDto(data);
  }

  public async findAllByIds(groupIds: string[]): Promise<GroupDto[]> {
    const rows = await this._repo.findAllByIds(groupIds);

    return rows.map((row) => this._toDto(row));
  }

  /**
   * Get groupId and childIds(user joinned) to show posts in timeline and in search
   * Anonymous: can not see posts
   * Guest can see post in current group(joinned or close) and child group(joined)
   */
  public getGroupIdAndChildIdsUserJoined(group: GroupDto, groupIdsUserJoined: string[]): string[] {
    const childGroupIds = [
      ...group.child.open,
      ...group.child.closed,
      ...group.child.private,
      ...group.child.secret,
    ];
    const filterGroupIdsUserJoined = [group.id, ...childGroupIds].filter((groupId) =>
      groupIdsUserJoined.includes(groupId)
    );

    if (group.privacy === GROUP_PRIVACY.OPEN) {
      filterGroupIdsUserJoined.push(group.id);
    }
    if (
      group.privacy === GROUP_PRIVACY.CLOSED &&
      this._hasJoinedCommunity(groupIdsUserJoined, group.rootGroupId)
    ) {
      filterGroupIdsUserJoined.push(group.id);
    }
    return ArrayHelper.arrayUnique(filterGroupIdsUserJoined);
  }

  private _hasJoinedCommunity(groupIdsUserJoined: string[], rootGroupId: string): boolean {
    return groupIdsUserJoined.includes(rootGroupId);
  }

  private _toDto(groupEntity: GroupEntity): GroupDto {
    return {
      id: groupEntity.get('id'),
      name: groupEntity.get('name'),
      icon: groupEntity.get('icon'),
      communityId: groupEntity.get('communityId'),
      isCommunity: groupEntity.get('isCommunity'),
      privacy: groupEntity.get('privacy'),
      rootGroupId: groupEntity.get('rootGroupId'),
      child: {
        closed: groupEntity.get('child').closed.map((item) => item),
        open: groupEntity.get('child').open.map((item) => item),
        private: groupEntity.get('child').private.map((item) => item),
        secret: groupEntity.get('child').secret.map((item) => item),
      },
    };
  }
}
