import { QUIZ_PROCESS_STATUS } from '@beincom/constants';

import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';

import { IEventData } from './interface';

import { BaseEvent } from '.';

type QuizProcessedExtraData = {
  quizId: string;
  contentId: string;
  description?: string;
  genStatus: QUIZ_PROCESS_STATUS;
};

export class QuizProcessedEventData implements IEventData {
  public verb: WS_ACTIVITY_VERB;
  public target: WS_TARGET_TYPE;
  public event: string;
  public extra: QuizProcessedExtraData;

  public constructor(data: QuizProcessedEventData) {
    Object.assign(this, data);
  }
}

export class QuizProcessedEvent extends BaseEvent<QuizProcessedEventData> {}
