import { UserDto } from '@libs/service/user';

import { ReportCreated } from '../../../../common/constants';
import { ReportEntity } from '../model/report';

interface ReportEventPayload {
  report: ReportEntity;
  actor: UserDto;
}

export class ReportCreatedEvent {
  public static event = ReportCreated;

  public payload: ReportEventPayload;

  public constructor(data: ReportEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return ReportCreatedEvent.event;
  }
}
