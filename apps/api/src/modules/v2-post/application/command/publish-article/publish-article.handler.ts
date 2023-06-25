import { Inject } from '@nestjs/common';
import { ArticleDto } from '../../dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PublishArticleCommand } from './publish-article.command';
import {
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ArticleEntity } from '../../../domain/model/content';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';

@CommandHandler(PublishArticleCommand)
export class PublishArticleHandler implements ICommandHandler<PublishArticleCommand, ArticleDto> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding
  ) {}

  public async execute(command: PublishArticleCommand): Promise<ArticleDto> {
    const { actor, id } = command.payload;

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

    if (
      !articleEntity ||
      !(articleEntity instanceof ArticleEntity) ||
      articleEntity.isHidden() ||
      (articleEntity.isPublished() && !articleEntity.getGroupIds()?.length)
    ) {
      throw new ContentNotFoundException();
    }

    this._contentValidator.checkCanReadContent(articleEntity, actor);

    if (!articleEntity.isOwner(actor.id)) throw new ContentNoCRUDPermissionException();

    if (!articleEntity.isPublished()) {
      await this._articleDomainService.publish({
        articleEntity,
        actor,
      });
    }

    await this._postDomainService.markSeen(articleEntity, actor.id);
    articleEntity.increaseTotalSeen();

    if (articleEntity.isImportant()) {
      await this._postDomainService.markReadImportant(articleEntity, actor.id);
      articleEntity.setMarkReadImportant();
    }

    return this._contentBinding.articleBinding(articleEntity, { actor });
  }
}
