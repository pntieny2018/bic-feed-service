import { Inject, Injectable } from '@nestjs/common';
import { uniq } from 'lodash';

import { UserDto } from '../../../v2-user/application';
import { RULES } from '../../constant';
import { ArticleLimitAttachedSeriesException } from '../exception';
import { ArticleEntity } from '../model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../service-adapter-interface /group-adapter.interface';

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
    const groups = await this._groupAdapter.getGroupByIds(groupIds);
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

  public async validateLimitedToAttachSeries(articleEntity: ArticleEntity): Promise<void> {
    if (articleEntity.isOverLimitedToAttachSeries()) {
      throw new ArticleLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }

    const contentWithArchivedGroups = (await this._contentRepository.findOne({
      where: {
        id: articleEntity.getId(),
        groupArchived: true,
      },
      include: {
        shouldIncludeSeries: true,
      },
    })) as ArticleEntity;

    if (!contentWithArchivedGroups) {
      return;
    }

    const series = uniq([
      ...articleEntity.getSeriesIds(),
      ...contentWithArchivedGroups?.getSeriesIds(),
    ]);

    if (series.length > RULES.LIMIT_ATTACHED_SERIES) {
      throw new ArticleLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }
  }
}
