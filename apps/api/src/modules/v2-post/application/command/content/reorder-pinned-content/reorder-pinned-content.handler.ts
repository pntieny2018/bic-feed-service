import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';

import { ReorderPinnedContentCommand } from './reorder-pinned-content.command';

@CommandHandler(ReorderPinnedContentCommand)
export class ReorderPinnedContentHandler
  implements ICommandHandler<ReorderPinnedContentCommand, void>
{
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService
  ) {}

  public async execute(command: ReorderPinnedContentCommand): Promise<void> {
    return this._contentDomain.reorderPinned(command.payload);
  }
}
