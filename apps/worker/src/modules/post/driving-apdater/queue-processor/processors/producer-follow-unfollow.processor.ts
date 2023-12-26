import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { ProducerFollowUnfollowGroupsCommand } from '../../../application/command/producer-follow-unfollow-groups';
import { ProducerFollowUnfollowJobPayload } from '../../../domain/infra-adapter-interface';
import { PRODUCER_FOLLOW_UNFOLLOW_PROCESSOR_TOKEN } from '../../../provider';
import { IProcessor } from '../interface';

@Component({ injectToken: PRODUCER_FOLLOW_UNFOLLOW_PROCESSOR_TOKEN })
export class ProducerFollowUnFollowGroupsProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<ProducerFollowUnfollowJobPayload>): Promise<void> {
    return this._commandBus.execute<ProducerFollowUnfollowGroupsCommand, void>(
      new ProducerFollowUnfollowGroupsCommand(job.data)
    );
  }
}
