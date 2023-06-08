import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { MarkReadImportantContentCommand } from './mark-read-important-content.command';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';

@CommandHandler(MarkReadImportantContentCommand)
export class MarkReadImportantContentHandler
  implements ICommandHandler<MarkReadImportantContentCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator
  ) {}

  public async execute(command: MarkReadImportantContentCommand): Promise<void> {
    const { id, authUser } = command.payload;
    const contentEntity = await this._contentRepository.findOne({
      where: {
        id,
      },
    });
    if (!contentEntity || contentEntity.isHidden()) return;
    if (contentEntity.isDraft()) return;
    if (!contentEntity.isImportant()) return;

    await this._postDomainService.markReadImportant(contentEntity, authUser.id);
  }
}
