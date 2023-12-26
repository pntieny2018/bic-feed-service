import {
  GROUP_SERVICE_TOKEN,
  IGroupService,
} from '@libs/service/group/src/group.service.interface';
import { Inject, Injectable } from '@nestjs/common';

import {
  CountUsersInGroupsProps,
  GetGroupsMembersProps,
  IGroupAdapter,
} from '../../domain/service-adapter-interface';

@Injectable()
export class GroupAdapter implements IGroupAdapter {
  public constructor(
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly _groupService: IGroupService
  ) {}

  public async getGroupsMembers(props: GetGroupsMembersProps): Promise<{ ids: string[] }> {
    return this._groupService.getPaginationGroupsMembers(props);
  }

  public async countUsersInGroups(props: CountUsersInGroupsProps): Promise<{ total: number }> {
    return this._groupService.countUsersInGroups(props);
  }
}
