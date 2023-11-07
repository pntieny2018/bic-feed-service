import { CONTENT_REPORT_REASON_TYPE } from '@beincom/constants';
import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

type ReportCommentPayload = {
  authUser: UserDto;
  commentId: string;
  reasonType: CONTENT_REPORT_REASON_TYPE;
  reason?: string;
};

export class ReportCommentCommand implements ICommand {
  public constructor(public readonly payload: ReportCommentPayload) {}
}
