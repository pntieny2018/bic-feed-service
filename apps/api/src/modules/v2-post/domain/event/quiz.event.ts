import { IEventPayload } from '@libs/infra/event';

import {
  QuizCreated,
  QuizGenerated,
  QuizParticipantFinished,
  QuizParticipantStarted,
  QuizRegenerate,
} from '../../../../common/constants';

interface QuizParticipantStartedEventPayload {
  quizParticipantId: string;
  startedAt: Date;
  timeLimit: number;
}

interface QuizParticipantFinishedEventPayload {
  quizParticipantId: string;
}

interface QuizEventPayload {
  quizId: string;
}

export class QuizParticipantStartedEvent implements IEventPayload {
  public static event = QuizParticipantStarted;

  public payload: QuizParticipantStartedEventPayload;

  public constructor(data: QuizParticipantStartedEventPayload) {
    this.payload = data;
  }
}

export class QuizParticipantFinishedEvent implements IEventPayload {
  public static event = QuizParticipantFinished;

  public payload: QuizParticipantFinishedEventPayload;

  public constructor(data: QuizParticipantFinishedEventPayload) {
    this.payload = data;
  }
}

export class QuizCreatedEvent {
  public static event = QuizCreated;

  public payload: QuizEventPayload;

  public constructor(data: QuizEventPayload) {
    this.payload = data;
  }
}

export class QuizGeneratedEvent {
  public static event = QuizGenerated;

  public payload: QuizEventPayload;

  public constructor(data: QuizEventPayload) {
    this.payload = data;
  }
}

export class QuizRegenerateEvent {
  public static event = QuizRegenerate;

  public payload: QuizEventPayload;

  public constructor(data: QuizEventPayload) {
    this.payload = data;
  }
}
