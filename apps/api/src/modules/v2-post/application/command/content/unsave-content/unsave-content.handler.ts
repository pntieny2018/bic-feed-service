import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';

import { UnsaveContentCommand } from './unsave-content.command';

@CommandHandler(UnsaveContentCommand)
export class UnsaveContentHandler implements ICommandHandler<UnsaveContentCommand, void> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async execute(command: UnsaveContentCommand): Promise<void> {
    const { authUser, contentId } = command.payload;
    return this._contentDomainService.unsaveContent(contentId, authUser.id);
  }
}