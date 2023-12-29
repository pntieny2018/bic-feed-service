import { Inject, Injectable } from '@nestjs/common';

import { NotCommunityAdminException } from '../exception';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';

import { IReportValidator } from './interface';

@Injectable()
export class ReportValidator implements IReportValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async checkPermissionManageReport(userId: string, groupId: string): Promise<void> {
    const { communityAdmin, owners } = await this._groupAdapter.getCommunityAdmins([groupId]);

    const isCommunityAdmin = communityAdmin?.[groupId]?.includes(userId);
    const isCommunityOwner = owners?.[groupId]?.includes(userId);

    if (!isCommunityAdmin && !isCommunityOwner) {
      throw new NotCommunityAdminException();
    }
  }
}
