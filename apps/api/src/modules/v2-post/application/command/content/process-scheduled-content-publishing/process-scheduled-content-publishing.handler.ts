import { CONTENT_TYPE } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { DomainNotFoundException } from '../../../../../../common/exceptions';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';

import { ProcessScheduledContentPublishingCommand } from './process-scheduled-content-publishing.command';

@CommandHandler(ProcessScheduledContentPublishingCommand)
export class ProcessScheduledContentPublishingHandler
  implements ICommandHandler<ProcessScheduledContentPublishingCommand, void>
{
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(command: ProcessScheduledContentPublishingCommand): Promise<void> {
    const { id, actorId } = command.payload;

    const contentEntity = await this._contentRepository.getContentById(id);
    const actor = await this._userAdapter.getUserByIdWithPermission(actorId);

    if (!actor) {
      throw new DomainNotFoundException('User not found');
    }

    try {
      switch (contentEntity.getType()) {
        case CONTENT_TYPE.ARTICLE: {
          await this._articleDomainService.publish({ payload: { id }, actor });
          break;
        }

        case CONTENT_TYPE.POST:
          {
            await this._postDomainService.publish({ payload: { id }, actor });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      contentEntity.setScheduleFailed();
      contentEntity.setErrorLog({
        message: error.message,
        code: error.code,
        stack: JSON.stringify(error.stack),
      });
      await this._contentRepository.update(contentEntity);
    }
  }
}
