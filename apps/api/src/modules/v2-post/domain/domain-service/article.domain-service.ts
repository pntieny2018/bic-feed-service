import { Inject, Injectable } from '@nestjs/common';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';
import { UpdateArticleProps, IArticleDomainService } from './interface';
import {
  CATEGORY_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
  ICategoryRepository,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../repositoty-interface';
import { InvalidResourceImageException } from '../exception/invalid-resource-image.exception';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../validator/interface';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import { ContentEmptyException } from '../exception/content-empty.exception';

@Injectable()
export class ArticleDomainService implements IArticleDomainService {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CATEGORY_REPOSITORY_TOKEN)
    protected readonly _categoryRepository: ICategoryRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository
  ) {}

  public async update(inputData: UpdateArticleProps): Promise<void> {
    const { articleEntity, newData } = inputData;
    const { actor, groupIds, categories, series, tags, coverMedia } = newData;

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

    if (tags) {
      const newTags = await this._tagRepository.findAll({ ids: tags });
      articleEntity.setTags(newTags);
    }

    if (categories) {
      const newCategories = await this._categoryRepository.findAll({ where: { ids: categories } });
      articleEntity.setCategories(newCategories);
    }

    const groups = await this._groupAppService.findAllByIds(
      groupIds || articleEntity.getGroupIds()
    );

    if (groupIds) {
      const oldGroupIds = articleEntity.get('groupIds');
      const isEnableSetting = articleEntity.isEnableSetting();

      await this._contentValidator.checkCanCRUDContent(
        actor,
        oldGroupIds,
        articleEntity.get('type')
      );

      articleEntity.setGroups(groupIds);
      articleEntity.setPrivacyFromGroups(groups);
      const state = articleEntity.getState();
      const attachGroupIds = state.attachGroupIds;

      if (attachGroupIds?.length) {
        await this._contentValidator.checkCanCRUDContent(
          actor,
          attachGroupIds,
          articleEntity.get('type')
        );
      }
      if (isEnableSetting) {
        await this._contentValidator.checkCanEditContentSetting(actor, groupIds);
      }
    }

    await this._contentValidator.validateSeriesAndTags(
      groups,
      series || articleEntity.getSeriesIds(),
      articleEntity.get('tags')
    );

    articleEntity.updateAttribute(newData);

    if (!articleEntity.isValidArticleToPublish()) throw new ContentEmptyException();

    if (!articleEntity.isChanged()) return;

    await this._contentRepository.update(articleEntity);
  }
}
