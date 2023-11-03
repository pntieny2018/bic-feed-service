import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';

import { SaveContentCommand } from './save-content.command';

@CommandHandler(SaveContentCommand)
export class SaveContentHandler implements ICommandHandler<SaveContentCommand, boolean> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly contentDomainService: IContentDomainService
  ) {}

  public async execute(command: SaveContentCommand): Promise<boolean> {
    const { contentId, authUser } = command.payload;
    await this.contentDomainService.saveContent(contentId, authUser);
    return true;
  }
}
