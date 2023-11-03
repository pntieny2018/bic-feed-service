import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';

import { PinContentCommand } from './pin-content.command';

@CommandHandler(PinContentCommand)
export class PinContentHandler implements ICommandHandler<PinContentCommand, void> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(command: PinContentCommand): Promise<void> {
    return this._contentDomainService.updatePinnedContent(command.payload);
  }
}
