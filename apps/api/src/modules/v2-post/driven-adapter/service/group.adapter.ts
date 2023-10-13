import { GroupDto } from '@libs/service/group/src/group.dto';
import {
  GROUP_SERVICE_TOKEN,
  IGroupService,
} from '@libs/service/group/src/group.service.interface';
import { Inject, Injectable } from '@nestjs/common';

import { IGroupAdapter } from '../../domain/service-adapter-interface';
import { GroupPrivacy } from '../../../v2-group/data-type';
import { ArrayHelper } from '../../../../common/helpers';
import { PRIVACY } from '@beincom/constants';

@Injectable()
export class GroupAdapter implements IGroupAdapter {
  public constructor(
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly _groupService: IGroupService
  ) {}

  public async getGroupsByIds(groupIds: string[]): Promise<GroupDto[]> {
    return this._groupService.findAllByIds(groupIds);
  }

  public async isAdminInAnyGroups(userId: string, groupIds: string[]): Promise<boolean> {
    return this._groupService.isAdminInAnyGroups(userId, groupIds);
  }

  public getGroupIdAndChildIdsUserJoined(group: GroupDto, groupIdsUserJoined: string[]): string[] {
    const childGroupIds = [
      ...group.child.open,
      ...group.child.closed,
      ...group.child.private,
      ...group.child.secret,
    ];
    const groupAndChildIdsUserJoined = [group.id, ...childGroupIds].filter((groupId) =>
      groupIdsUserJoined.includes(groupId)
    );

    if (group.privacy === PRIVACY.OPEN) {
      groupAndChildIdsUserJoined.push(group.id);
    }

    const hasJoinedCommunity = groupIdsUserJoined.includes(group.rootGroupId);
    if (group.privacy === PRIVACY.CLOSED && hasJoinedCommunity) {
      groupAndChildIdsUserJoined.push(group.id);
    }
    return ArrayHelper.arrayUnique(groupAndChildIdsUserJoined);
  }
}
