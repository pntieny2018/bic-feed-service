import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';

import { SeenContentCommand } from './seen-content.command';

@CommandHandler(SeenContentCommand)
export class SeenContentHandler implements ICommandHandler<SeenContentCommand> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(command: SeenContentCommand): Promise<void> {
    const { authUser, contentId } = command.payload;
    return this._contentDomainService.markSeen(contentId, authUser.id);
  }
}
