import { GroupDto } from '@libs/service/group/src/group.dto';
import {
  GROUP_SERVICE_TOKEN,
  IGroupService,
} from '@libs/service/group/src/group.service.interface';
import { Inject, Injectable } from '@nestjs/common';

import { IGroupAdapter } from '../../domain/service-adapter-interface';

@Injectable()
export class GroupAdapter implements IGroupAdapter {
  public constructor(
    @Inject(GROUP_SERVICE_TOKEN)
    private readonly _groupService: IGroupService
  ) {}

  public async getGroupByIds(groupIds: string[]): Promise<GroupDto[]> {
    return this._groupService.findAllByIds(groupIds);
  }
}
