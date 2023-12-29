import { IQueueService, QUIZ_PARTICIPANT_SERVICE_TOKEN } from '@libs/infra/v2-queue';
import { Component } from '@libs/infra/v2-queue/decorators';
import { Inject } from '@nestjs/common';

import { QUIZ_PARTICIPANT_PUBLISHER_TOKEN } from '../../provider';

import { BasePublisher } from './base-publisher';

@Component({ injectToken: QUIZ_PARTICIPANT_PUBLISHER_TOKEN })
export class QuizParticipantPublisher extends BasePublisher {
  public constructor(
    @Inject(QUIZ_PARTICIPANT_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {
    super(_queueService);
  }
}
