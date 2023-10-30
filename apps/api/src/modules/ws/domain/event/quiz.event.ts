import { QUIZ_PROCESS_STATUS } from '@beincom/constants';

import { TargetType, VerbActivity } from '../../data-type';

import { QUIZ_HAS_BEEN_PROCESSED } from './constant';
import { IEvent, IEventData } from './interface';

type QuizProcessedExtraData = {
  quizId: string;
  description?: string;
  genStatus: QUIZ_PROCESS_STATUS;
};

export class QuizProcessedEventData implements IEventData {
  public target = TargetType.QUIZ;
  public event = QUIZ_HAS_BEEN_PROCESSED;
  public verb = VerbActivity.GENERATE_QUIZ;
  public extra: QuizProcessedExtraData;

  public constructor(extra: QuizProcessedExtraData) {
    Object.assign(this, {
      extra: extra,
    });
  }
}

export class QuizProcessedEvent implements IEvent {
  public rooms: string[];
  public data: QuizProcessedEventData;

  public constructor(payload: QuizProcessedEvent) {
    Object.assign(this, payload);
  }
}
