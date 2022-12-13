import { IEvent } from '../../common/interfaces';
import { ReportContentHasBeenCreated } from '../../common/constants';
import { IReportContentAttribute } from '../../database/models/report-content.model';
import { UserDto } from '../../modules/auth';

export type CreateReportEventPayload = IReportContentAttribute & { actor: UserDto };

export class CreateReportEvent implements IEvent<CreateReportEventPayload> {
  public static event = ReportContentHasBeenCreated;

  public payload: CreateReportEventPayload;

  public constructor(payload: CreateReportEventPayload) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return CreateReportEvent.event;
  }
}
