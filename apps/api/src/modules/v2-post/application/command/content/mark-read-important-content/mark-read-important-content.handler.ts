import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';

import { MarkReadImportantContentCommand } from './mark-read-important-content.command';

@CommandHandler(MarkReadImportantContentCommand)
export class MarkReadImportantContentHandler
  implements ICommandHandler<MarkReadImportantContentCommand, void>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService
  ) {}

  public async execute(command: MarkReadImportantContentCommand): Promise<void> {
    const { id, authUser } = command.payload;

    return this._postDomainService.markReadImportant(id, authUser.id);
  }
}
