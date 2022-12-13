import { UserDto } from '../../modules/auth';
import { IEvent } from '../../common/interfaces';
import { ReportContentHasBeenApproved } from '../../common/constants';
import { IReportContentAttribute } from '../../database/models/report-content.model';

export type ApproveReportEventPayload = IReportContentAttribute & { actor: UserDto };

export class ApproveReportEvent implements IEvent<ApproveReportEventPayload> {
  public static event = ReportContentHasBeenApproved;

  public payload: ApproveReportEventPayload;

  public constructor(payload: ApproveReportEventPayload) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return ApproveReportEvent.event;
  }
}
