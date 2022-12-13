import { IEvent } from '../../common/interfaces';
import { ReportContentHasBeenCreated } from '../../common/constants';
import { IReportContentAttribute } from '../../database/models/report-content.model';

export class CreateReportEvent implements IEvent<IReportContentAttribute> {
  public static event = ReportContentHasBeenCreated;

  public payload: IReportContentAttribute;

  public constructor(payload: IReportContentAttribute) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return CreateReportEvent.event;
  }
}
