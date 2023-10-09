import { PRIVACY } from '@beincom/constants';
import { GroupDto } from '@libs/service/group/src/group.dto';
import {
  GROUP_SERVICE_TOKEN,
  IGroupService,
} from '@libs/service/group/src/group.service.interface';
import { Inject, Injectable } from '@nestjs/common';

import { ArrayHelper } from '../../../../common/helpers';
import { GroupNotFoundException } from '../../domain/exception';
import { IGroupAdapter } from '../../domain/service-adapter-interface';

@Injectable()
export class GroupAdapter implements IGroupAdapter {
  public constructor(
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly _groupService: IGroupService
  ) {}

  public async getGroupById(groupId: string): Promise<GroupDto> {
    const group = await this._groupService.findById(groupId);
    if (!group) {
      throw new GroupNotFoundException();
    }
    return group;
  }

  public async getGroupsByIds(groupIds: string[]): Promise<GroupDto[]> {
    return this._groupService.findAllByIds(groupIds);
  }

  public getGroupIdsAndChildIdsUserJoined(group: GroupDto, groupIdsUserJoined: string[]): string[] {
    const childGroupIds = [
      ...group.child.open,
      ...group.child.closed,
      ...group.child.private,
      ...group.child.secret,
    ];
    const filterGroupIdsUserJoined = [group.id, ...childGroupIds].filter((groupId) =>
      groupIdsUserJoined.includes(groupId)
    );

    if (group.privacy === PRIVACY.OPEN) {
      filterGroupIdsUserJoined.push(group.id);
    }
    if (group.privacy === PRIVACY.CLOSED && groupIdsUserJoined.includes(group.rootGroupId)) {
      filterGroupIdsUserJoined.push(group.id);
    }
    return ArrayHelper.arrayUnique(filterGroupIdsUserJoined);
  }
}
