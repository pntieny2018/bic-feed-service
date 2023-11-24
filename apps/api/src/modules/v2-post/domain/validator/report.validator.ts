import { Inject, Injectable } from '@nestjs/common';

import { NotCommunityAdminException, ReportNotFoundException } from '../exception';
import { ReportEntity } from '../model/report';
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

  public validateReportInGroup(reportEntity: ReportEntity, groupId: string): void {
    if (!reportEntity) {
      throw new ReportNotFoundException();
    }

    const isReportInGroup = reportEntity.getDetails().some((detail) => detail.groupId == groupId);
    if (!isReportInGroup) {
      throw new ReportNotFoundException('Report not found in this group');
    }
  }
}
