import { uniq } from 'lodash';
import { Inject, Injectable } from '@nestjs/common';
import { ArticleEntity } from '../model/content';
import { UserDto } from '../../../v2-user/application';
import { CONTENT_VALIDATOR_TOKEN, IArticleValidator, IContentValidator } from './interface';
import { GROUP_APPLICATION_TOKEN, IGroupApplicationService } from '../../../v2-group/application';

@Injectable()
export class ArticleValidator implements IArticleValidator {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    protected _groupAppService: IGroupApplicationService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
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
}
