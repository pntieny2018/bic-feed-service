import { uniq } from 'lodash';
import { Inject, Injectable } from '@nestjs/common';
import { ArticleEntity } from '../model/content';
import { UserDto } from '../../../v2-user/application';
import { ContentEmptyGroupException } from '../exception';
import {
  CATEGORY_VALIDATOR_TOKEN,
  CONTENT_VALIDATOR_TOKEN,
  IArticleValidator,
  ICategoryValidator,
  IContentValidator,
  ValidationPayload,
} from './interface';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../repositoty-interface';

@Injectable()
export class ArticleValidator implements IArticleValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CATEGORY_VALIDATOR_TOKEN)
    private readonly _categoryValidator: ICategoryValidator,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository
  ) {}

  public async validatePublishAction(articleEntity: ArticleEntity, actor: UserDto): Promise<void> {
    const state = articleEntity.getState();
    const postType = articleEntity.get('type');
    const groupIds = articleEntity.get('groupIds');
    const isEnableSetting = articleEntity.isEnableSetting();

    const { attachGroupIds, detachGroupIds } = state;
    const groups = await this._groupAppService.findAllByIds(groupIds);
    const communityIds = uniq(groups.map((group) => group.rootGroupId));

    articleEntity.setCommunity(communityIds);
    await this._contentValidator.checkCanCRUDContent(actor, groupIds, postType);

    if (isEnableSetting && (attachGroupIds?.length || detachGroupIds?.length)) {
      await this._contentValidator.checkCanEditContentSetting(actor, groupIds);
    }

    await this._contentValidator.validateSeriesAndTags(
      groups,
      articleEntity.get('seriesIds'),
      articleEntity.get('tags')
    );
  }

  public async validateUpdateAction(
    articleEntity: ArticleEntity,
    actor: UserDto,
    payload: ValidationPayload
  ): Promise<void> {
    const { groupIds, seriesIds, tagIds, categoryIds } = payload;

    if (categoryIds && categoryIds.length) {
      await this._categoryValidator.checkValidCategories(categoryIds, actor.id);
    }

    const oldGroupIds = articleEntity.get('groupIds');
    const groupIdsNeedFind = groupIds || oldGroupIds;
    const newTags = tagIds
      ? await this._tagRepository.findAll({ ids: tagIds })
      : articleEntity.get('tags');
    const groups = await this._groupAppService.findAllByIds(groupIdsNeedFind);
    const communityIds = uniq(groups.map((group) => group.rootGroupId));

    articleEntity.setTags(newTags);
    articleEntity.setGroups(groupIdsNeedFind);
    articleEntity.setCommunity(communityIds);
    articleEntity.setPrivacyFromGroups(groups);

    if (articleEntity.isPublished() || articleEntity.isWaitingSchedule()) {
      if (groupIdsNeedFind && !groupIdsNeedFind.length) throw new ContentEmptyGroupException();

      await this._contentValidator.checkCanCRUDContent(
        actor,
        oldGroupIds,
        articleEntity.get('type')
      );

      const state = articleEntity.getState();
      const isEnableSetting = articleEntity.isEnableSetting();
      const { attachGroupIds, detachGroupIds } = state;

      if (attachGroupIds?.length) {
        await this._contentValidator.checkCanCRUDContent(
          actor,
          attachGroupIds,
          articleEntity.get('type')
        );
      }

      if (isEnableSetting && (attachGroupIds?.length || detachGroupIds?.length)) {
        await this._contentValidator.checkCanEditContentSetting(actor, groupIds);
      }
    }

    await this._contentValidator.validateSeriesAndTags(
      groups,
      seriesIds || articleEntity.get('seriesIds'),
      articleEntity.get('tags')
    );
  }
}
