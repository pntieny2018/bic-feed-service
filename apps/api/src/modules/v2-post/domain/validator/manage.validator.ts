import { Inject, Injectable } from '@nestjs/common';

import { NotCommunityAdminException } from '../exception';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';

import { CanManageReportContentPayload, IManageValidator } from './interface';

@Injectable()
export class ManageValidator implements IManageValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async validateManageReportContent(props: CanManageReportContentPayload): Promise<void> {
    const { communityAdmin, owners } = await this._groupAdapter.getCommunityAdmins([
      props.rootGroupId,
    ]);

    const isCommunityAdmin = communityAdmin?.[props.rootGroupId]?.includes(props.userId);
    const isCommunityOwner = owners?.[props.rootGroupId]?.includes(props.userId);

    if (!isCommunityAdmin && !isCommunityOwner) {
      throw new NotCommunityAdminException();
    }
  }
}
