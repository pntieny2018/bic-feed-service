import { CONTENT_REPORT_REASON_TYPE } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

type ReportContentPayload = {
  authUser: UserDto;
  contentId: string;
  reasonType: CONTENT_REPORT_REASON_TYPE;
  reason?: string;
};

export class ReportContentCommand implements ICommand {
  public constructor(public readonly payload: ReportContentPayload) {}
}
