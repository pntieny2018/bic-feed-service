import { Inject, Injectable } from '@nestjs/common';
import { ArticleEntity } from '../model/content';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';
import { UpdateArticleProps, IArticleDomainService, PublishArticleProps } from './interface';
import {
  CATEGORY_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICategoryRepository,
  IContentRepository,
} from '../repositoty-interface';
import { ContentEmptyException, InvalidResourceImageException } from '../exception';
import { ARTICLE_VALIDATOR_TOKEN, IArticleValidator } from '../validator/interface';

@Injectable()
export class ArticleDomainService implements IArticleDomainService {
  public constructor(
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(ARTICLE_VALIDATOR_TOKEN)
    private readonly _articleValidator: IArticleValidator,
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    protected readonly _categoryRepository: ICategoryRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async publish(inputData: PublishArticleProps): Promise<ArticleEntity> {
    const { articleEntity, actor } = inputData;

    await this._articleValidator.validatePublishAction(articleEntity, actor);

    articleEntity.setPublish();

    if (!articleEntity.isValidArticleToPublish()) throw new ContentEmptyException();

    await this._contentRepository.update(articleEntity);

    return articleEntity;
  }

  public async update(inputData: UpdateArticleProps): Promise<void> {
    const { articleEntity, newData } = inputData;
    const { actor, groupIds, categories, series, tags, coverMedia } = newData;

    await this._articleValidator.validateUpdateAction(articleEntity, actor, {
      groupIds,
      categoryIds: categories,
      seriesIds: series,
      tagIds: tags,
    });

    if (coverMedia) {
      const images = await this._mediaDomainService.getAvailableImages(
        [articleEntity.get('cover')],
        [coverMedia.id],
        articleEntity.get('createdBy')
      );
      if (images[0] && !images[0].isArticleCoverResource()) {
        throw new InvalidResourceImageException();
      }
      articleEntity.setCover(images[0]);
    }

    if (categories) {
      const newCategories = await this._categoryRepository.findAll({ where: { ids: categories } });
      articleEntity.setCategories(newCategories);
    }

    articleEntity.updateAttribute(newData);

    if (!articleEntity.isValidArticleToPublish()) throw new ContentEmptyException();

    if (!articleEntity.isChanged()) return;

    await this._contentRepository.update(articleEntity);
  }
}
