import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { IReportValidator, REPORT_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';

import { IgnoreReportCommand } from './ignore-report.command';

@CommandHandler(IgnoreReportCommand)
export class IgnoreReportHandler implements ICommandHandler<IgnoreReportCommand, void> {
  public constructor(
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
    @Inject(REPORT_VALIDATOR_TOKEN)
    private readonly _reportValidator: IReportValidator
  ) {}

  public async execute(command: IgnoreReportCommand): Promise<void> {
    const { groupId, reportId, authUser } = command.payload;

    await this._reportValidator.checkPermissionManageReport(authUser.id, groupId);

    await this._reportDomain.ignoreReport({ authUser, reportId, groupId });
  }
}
