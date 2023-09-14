import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../../domain/domain-service/interface';

import { SchedulePostCommand } from './schedule-post.command';

@CommandHandler(SchedulePostCommand)
export class SchedulePostHandler implements ICommandHandler<SchedulePostCommand, void> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService
  ) {}

  public async execute(command: SchedulePostCommand): Promise<void> {
    throw new Error('Not implemented');
  }
}
