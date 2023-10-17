import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';

import { AutoSavePostCommand } from './auto-save-post.command';

@CommandHandler(AutoSavePostCommand)
export class AutoSavePostHandler implements ICommandHandler<AutoSavePostCommand, void> {
  public constructor(
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService
  ) {}

  public async execute(command: AutoSavePostCommand): Promise<void> {
    const { authUser, ...payload } = command.payload;
    return this._postDomainService.autoSavePost({ actor: authUser, payload });
  }
}
