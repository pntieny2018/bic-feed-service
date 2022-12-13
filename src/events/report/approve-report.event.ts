import { IEvent } from '../../common/interfaces';
import { ReportContentHasBeenApproved } from '../../common/constants';
import { IReportContentAttribute } from '../../database/models/report-content.model';

export class ApproveReportEvent implements IEvent<IReportContentAttribute> {
  public static event = ReportContentHasBeenApproved;

  public payload: IReportContentAttribute;

  public constructor(payload: IReportContentAttribute) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return ApproveReportEvent.event;
  }
}
