import { QUIZ_PROCESS_STATUS } from '@beincom/constants';

import { TargetType, VerbActivity } from '../../data-type';

import { IEvent, IEventData } from './interface';

type QuizProcessedExtraData = {
  quizId: string;
  contentId: string;
  description?: string;
  genStatus: QUIZ_PROCESS_STATUS;
};

export class QuizProcessedEventData implements IEventData {
  public verb: VerbActivity;
  public target: TargetType;
  public event: string;
  public extra: QuizProcessedExtraData;

  public constructor(data: QuizProcessedEventData) {
    Object.assign(this, data);
  }
}

export class QuizProcessedEvent implements IEvent {
  public rooms: string[];
  public data: QuizProcessedEventData;

  public constructor(payload: QuizProcessedEvent) {
    Object.assign(this, payload);
  }
}
