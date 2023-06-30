import { uniq } from 'lodash';
import { RULES } from '../../constant';
import { Inject, Injectable } from '@nestjs/common';
import { ArticleEntity } from '../model/content';
import { UserDto } from '../../../v2-user/application';
import { ArticleLimitAttachedSeriesException } from '../exception';
import { CONTENT_VALIDATOR_TOKEN, IArticleValidator, IContentValidator } from './interface';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';

@Injectable()
export class ArticleValidator implements IArticleValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async validateArticle(articleEntity: ArticleEntity, actor: UserDto): Promise<void> {
    const groupIds = articleEntity.get('groupIds');
    const groups = await this._groupAppService.findAllByIds(groupIds);
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

  public async validateLimtedToAttachSeries(articleEntity: ArticleEntity): Promise<void> {
    if (articleEntity.isOverLimtedToAttachSeries()) {
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

    if (contentWithArchivedGroups) {
      const series = uniq([
        ...articleEntity.getSeriesIds(),
        ...contentWithArchivedGroups?.getSeriesIds(),
      ]);

      if (series.length > RULES.LIMIT_ATTACHED_SERIES) {
        throw new ArticleLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
      }
    }
  }
}
