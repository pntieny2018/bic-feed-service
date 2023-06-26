import { Inject, Injectable } from '@nestjs/common';
import { ArticleEntity } from '../model/content';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';
import {
  UpdateArticleProps,
  IArticleDomainService,
  PublishArticleProps,
  ArticlePayload,
} from './interface';
import {
  CATEGORY_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICategoryRepository,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { ContentEmptyException, InvalidResourceImageException } from '../exception';
import {
  ARTICLE_VALIDATOR_TOKEN,
  CATEGORY_VALIDATOR_TOKEN,
  IArticleValidator,
  ICategoryValidator,
} from '../validator/interface';

@Injectable()
export class ArticleDomainService implements IArticleDomainService {
  public constructor(
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(ARTICLE_VALIDATOR_TOKEN)
    private readonly _articleValidator: IArticleValidator,
    @Inject(CATEGORY_VALIDATOR_TOKEN)
    private readonly _categoryValidator: ICategoryValidator,
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    protected readonly _categoryRepository: ICategoryRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository
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
    const { actor } = newData;

    this._setArticleEntityAttributes(articleEntity, newData);

    await this._articleValidator.validateUpdateAction(articleEntity, actor);

    if (!articleEntity.isValidArticleToPublish()) throw new ContentEmptyException();

    if (!articleEntity.isChanged()) return;

    await this._contentRepository.update(articleEntity);
  }

  public async autoSave(inputData: UpdateArticleProps): Promise<void> {
    const { articleEntity, newData } = inputData;
    const { actor } = newData;

    this._setArticleEntityAttributes(articleEntity, newData);

    await this._articleValidator.validateUpdateAction(articleEntity, actor);

    if (!articleEntity.isChanged()) return;

    await this._contentRepository.update(articleEntity);
  }

  private async _setArticleEntityAttributes(
    articleEntity: ArticleEntity,
    payload: ArticlePayload
  ): Promise<void> {
    const { actor, categories, tags, coverMedia } = payload;

    if (tags) {
      const newTags = await this._tagRepository.findAll({ ids: tags });
      articleEntity.setTags(newTags);
    }

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
      if (newCategories.length) {
        await this._categoryValidator.checkValidCategories(categories, actor.id);
      }
      articleEntity.setCategories(newCategories);
    }

    articleEntity.updateAttribute(payload);
  }
}
