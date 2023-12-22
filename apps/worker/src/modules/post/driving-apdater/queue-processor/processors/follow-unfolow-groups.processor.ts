import { Component } from '@libs/infra/v2-queue/decorators';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { CommandBus } from '@nestjs/cqrs';

import { DispatchFollowUnfollowGroupsCommand } from '../../../application/command/dispatch-follow-unfollow-groups';
import { FollowUnfollowGroupsJobPayload } from '../../../domain/infra-adapter-interface';
import { FOLLOW_UNFOLLOW_GROUPS_PROCESSOR_TOKEN } from '../../../provider';
import { IProcessor } from '../interface';

@Component({ injectToken: FOLLOW_UNFOLLOW_GROUPS_PROCESSOR_TOKEN })
export class FollowUnFollowGroupsProcessor implements IProcessor {
  public constructor(private readonly _commandBus: CommandBus) {}

  public async processMessage(job: JobPro<FollowUnfollowGroupsJobPayload>): Promise<void> {
    this._commandBus.execute<DispatchFollowUnfollowGroupsCommand, void>(
      new DispatchFollowUnfollowGroupsCommand(job.data)
    );
  }
}
