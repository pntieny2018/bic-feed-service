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

  public getEventName(): string {
    return QuizParticipantStartedEvent.event;
  }
}

export class QuizParticipantFinishedEvent implements IEventPayload {
  public static event = QuizParticipantFinished;

  public payload: QuizParticipantFinishedEventPayload;

  public constructor(data: QuizParticipantFinishedEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return QuizParticipantFinishedEvent.event;
  }
}

export class QuizCreatedEvent implements IEventPayload {
  public static event = QuizCreated;

  public payload: QuizEventPayload;

  public constructor(data: QuizEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return QuizCreatedEvent.event;
  }
}

export class QuizGeneratedEvent implements IEventPayload {
  public static event = QuizGenerated;

  public payload: QuizEventPayload;

  public constructor(data: QuizEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return QuizGeneratedEvent.event;
  }
}

export class QuizRegenerateEvent implements IEventPayload {
  public static event = QuizRegenerate;

  public payload: QuizEventPayload;

  public constructor(data: QuizEventPayload) {
    this.payload = data;
  }

  public getEventName(): string {
    return QuizRegenerateEvent.event;
  }
}
