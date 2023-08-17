import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ArticleDto } from '../../dto';

import { PublishArticleCommand } from './publish-article.command';

@CommandHandler(PublishArticleCommand)
export class PublishArticleHandler implements ICommandHandler<PublishArticleCommand, ArticleDto> {
  public constructor(
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding
  ) {}

  public async execute(command: PublishArticleCommand): Promise<ArticleDto> {
    const { actor } = command.payload;
    const articleEntity = await this._articleDomainService.publish(command.payload);

    await this._postDomainService.markSeen(articleEntity.get('id'), actor.id);
    articleEntity.increaseTotalSeen();

    if (articleEntity.isImportant()) {
      await this._postDomainService.markReadImportant(articleEntity.get('id'), actor.id);
      articleEntity.setMarkReadImportant();
    }

    return this._contentBinding.articleBinding(articleEntity, { actor, authUser: actor });
  }
}
