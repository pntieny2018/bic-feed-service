import { Inject } from '@nestjs/common';
import { ArticleDto } from '../../dto';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../domain/domain-service/interface';
import { ArticleEntity } from '../../../domain/model/content';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ScheduleArticleCommand } from './schedule-article.command';
import {
  ContentHasBeenPublishedException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@CommandHandler(ScheduleArticleCommand)
export class ScheduleArticleHandler implements ICommandHandler<ScheduleArticleCommand, ArticleDto> {
  public constructor(
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService
  ) {}

  public async execute(command: ScheduleArticleCommand): Promise<ArticleDto> {
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
      articleEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (articleEntity.isPublished()) throw new ContentHasBeenPublishedException();

    await this._articleDomainService.schedule({
      articleEntity,
      newData: command.payload,
    });

    return this._contentBinding.articleBinding(articleEntity, { actor, authUser: actor });
  }
}
