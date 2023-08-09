import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AutoSaveArticleCommand } from './auto-save-article.command';
import {
  ContentAccessDeniedException,
  ArticleRequiredCoverException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ArticleEntity } from '../../../domain/model/content';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../domain/domain-service/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';

@CommandHandler(AutoSaveArticleCommand)
export class AutoSaveArticleHandler implements ICommandHandler<AutoSaveArticleCommand, void> {
  public constructor(
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async execute(command: AutoSaveArticleCommand): Promise<void> {
    const { actor, id, coverMedia } = command.payload;

    const articleEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeCategory: true,
        shouldIncludeSeries: true,
      },
    });

    if (!articleEntity || !(articleEntity instanceof ArticleEntity)) {
      throw new ContentNotFoundException();
    }

    if (articleEntity.isPublished()) return;

    if (!articleEntity.isOwner(actor.id)) throw new ContentAccessDeniedException();

    if (coverMedia && !coverMedia.id) throw new ArticleRequiredCoverException();

    await this._articleDomainService.autoSave({
      articleEntity,
      newData: command.payload,
      actor,
    });
  }
}
