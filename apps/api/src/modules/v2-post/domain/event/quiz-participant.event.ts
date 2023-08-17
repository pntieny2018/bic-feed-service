import { IEventPayload } from '@libs/infra/event';

import { QuizParticipantStarted } from '../../../../common/constants';

interface QuizParticipantStartedEventPayload {
  quizParticipantId: string;
  startedAt: Date;
  timeLimit: number;
}

interface QuizParticipantFinishedEventPayload {
  quizParticipantId: string;
}

export class QuizParticipantStartedEvent implements IEventPayload {
  public static event = QuizParticipantStarted;

  public payload: QuizParticipantStartedEventPayload;

  public constructor(data: QuizParticipantStartedEventPayload) {
    this.payload = data;
  }
}

export class QuizParticipantFinishedEvent implements IEventPayload {
  public static event = QuizParticipantStarted;

  public payload: QuizParticipantFinishedEventPayload;

  public constructor(data: QuizParticipantFinishedEventPayload) {
    this.payload = data;
  }
}
