import { UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';
import { uniq } from 'lodash';

import { ContentEmptyContentException } from '../exception';
import { ArticleEntity } from '../model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../service-adapter-interface';

import { CONTENT_VALIDATOR_TOKEN, IArticleValidator, IContentValidator } from './interface';

@Injectable()
export class ArticleValidator implements IArticleValidator {
  public constructor(
    @Inject(GROUP_ADAPTER)
    protected _groupAdapter: IGroupAdapter,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async validateArticle(articleEntity: ArticleEntity, actor: UserDto): Promise<void> {
    const groupIds = articleEntity.get('groupIds');
    const groups = await this._groupAdapter.getGroupsByIds(groupIds);
    const communityIds = uniq(groups.map((group) => group.rootGroupId));

    articleEntity.setCommunity(communityIds);
    articleEntity.setPrivacyFromGroups(groups);

    if (articleEntity.isPublished() || articleEntity.isWaitingSchedule()) {
      await this._contentValidator.validatePublishContent(articleEntity, actor, groupIds);

      await this._contentValidator.validateSeriesAndTags(
        groups,
        articleEntity.get('seriesIds'),
        articleEntity.get('tags')
      );
    }
  }

  public validateArticleToPublish(articleEntity: ArticleEntity): void {
    if (!articleEntity.isValidArticleToPublish()) {
      throw new ContentEmptyContentException();
    }
  }
}
