import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateArticleCommand } from './update-article.command';
import {
  ArticleRequiredCoverException,
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ArticleEntity } from '../../../domain/model/content';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import {
  ARTICLE_DOMAIN_SERVICE_TOKEN,
  IArticleDomainService,
} from '../../../domain/domain-service/interface';

@CommandHandler(UpdateArticleCommand)
export class UpdateArticleHandler implements ICommandHandler<UpdateArticleCommand, void> {
  public constructor(
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(ARTICLE_DOMAIN_SERVICE_TOKEN)
    private readonly _articleDomainService: IArticleDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async execute(command: UpdateArticleCommand): Promise<void> {
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

    if (coverMedia && !coverMedia.id) throw new ArticleRequiredCoverException();

    await this._articleDomainService.update({
      articleEntity,
      newData: command.payload,
    });
  }
}
