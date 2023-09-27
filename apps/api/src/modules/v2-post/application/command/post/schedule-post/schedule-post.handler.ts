import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../../domain/validator/interface';

import { SchedulePostCommand } from './schedule-post.command';

@CommandHandler(SchedulePostCommand)
export class SchedulePostHandler implements ICommandHandler<SchedulePostCommand, void> {
  public constructor(
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,

    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async execute(command: SchedulePostCommand): Promise<void> {
    const { actor, ...payload } = command.payload;

    this._contentValidator.validateScheduleTime(payload.scheduledAt);

    await this._postDomainService.schedule({ payload, actor });
  }
}
