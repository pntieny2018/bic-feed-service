import { IEventPayload } from '@libs/infra/event';
import { UserDto } from '@libs/service/user';

import { ReportHasBeenCreated } from '../../../../common/constants';
import { ReportEntity } from '../model/report';

interface ReportEventPayload {
  report: ReportEntity;
  authUser: UserDto;
}

export class ReportCreatedEvent implements IEventPayload {
  public static event = ReportHasBeenCreated;

  public payload: ReportEventPayload;

  public constructor(data: ReportEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ReportCreatedEvent.event;
  }
}
