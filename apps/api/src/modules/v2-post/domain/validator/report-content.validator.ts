import { Inject, Injectable } from '@nestjs/common';

import { NotGroupAdminException } from '../exception';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';

import { IReportContentValidator, ValidateAdminRootGroupPayload } from './interface';

@Injectable()
export class ReportContentValidator implements IReportContentValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter
  ) {}

  public async validateAdminRootGroup(props: ValidateAdminRootGroupPayload): Promise<void> {
    const groupAdminsMapper = await this._groupAdapter.getGroupAdminMap([props.rootGroupId]);
    if (!groupAdminsMapper?.[props.rootGroupId]?.includes(props.userId)) {
      throw new NotGroupAdminException();
    }
  }
}
