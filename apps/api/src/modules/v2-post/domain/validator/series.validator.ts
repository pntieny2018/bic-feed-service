import { uniq } from 'lodash';
import { RULES } from '../../constant';
import { ISeriesValidator } from './interface';
import { Inject, Injectable } from '@nestjs/common';
import { ArticleEntity, PostEntity } from '../model/content';
import { ArticleLimitAttachedSeriesException } from '../exception';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../repositoty-interface';

@Injectable()
export class SeriesValidator implements ISeriesValidator {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async validateLimtedToAttachSeries(content: PostEntity | ArticleEntity): Promise<void> {
    if (content.isOverLimtedToAttachSeries()) {
      throw new ArticleLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }

    const contentWithArchivedGroups = (await this._contentRepository.findOne({
      where: {
        id: content.getId(),
        groupArchived: true,
      },
      include: {
        shouldIncludeSeries: true,
      },
    })) as PostEntity | ArticleEntity;

    const series = uniq([...content.getSeriesIds(), ...contentWithArchivedGroups.getSeriesIds()]);

    if (series.length > RULES.LIMIT_ATTACHED_SERIES) {
      throw new ArticleLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }
  }
}
