import {
  GROUP_SERVICE_TOKEN,
  IGroupService,
} from '@libs/service/group/src/group.service.interface';
import { Inject, Injectable } from '@nestjs/common';

import { GetUserIdsInGroupsProps, IGroupAdapter } from '../../domain/service-adapter-interface';

@Injectable()
export class GroupAdapter implements IGroupAdapter {
  public constructor(
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly _groupService: IGroupService
  ) {}

  public async getUserIdsInGroups(
    props: GetUserIdsInGroupsProps
  ): Promise<{ list: string[]; cursor: string }> {
    return this._groupService.getUserIdsInGroups(props);
  }
}
