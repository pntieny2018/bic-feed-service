import { ReportHasBeenCreated } from '../../common/constants';
import { IEvent } from '../../common/interfaces';
import { IReportContentAttribute } from '../../database/models/report-content.model';
import { UserDto } from '../../modules/v2-user/application';

export type CreateReportEventPayload = IReportContentAttribute & {
  actor: UserDto;
  groupIds: string[];
  content: string;
  actorsReported: UserDto[];
};

export class CreateReportEvent implements IEvent<CreateReportEventPayload> {
  public static event = ReportHasBeenCreated;

  public payload: CreateReportEventPayload;

  public constructor(payload: CreateReportEventPayload) {
    Object.assign(this, { payload: payload });
  }

  public getEventName(): string {
    return CreateReportEvent.event;
  }
}
