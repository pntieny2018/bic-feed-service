import { Inject, Injectable } from '@nestjs/common';

import { NotCommunityAdminException } from '../exception';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';

import { CanManageReportContentPayload, IReportContentValidator } from './interface';

@Injectable()
export class ReportContentValidator implements IReportContentValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async canManageReportContent(props: CanManageReportContentPayload): Promise<void> {
    const { admins, owners } = await this._groupAdapter.getCommunityAdmins([props.rootGroupId]);

    const isCommunityAdmin = admins?.[props.rootGroupId]?.includes(props.userId);
    const isCommunityOwner = owners?.[props.rootGroupId]?.includes(props.userId);

    if (!isCommunityAdmin && !isCommunityOwner) {
      throw new NotCommunityAdminException();
    }
  }
}
