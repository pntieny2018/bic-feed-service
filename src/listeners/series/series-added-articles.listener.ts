import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { SeriesAddedArticlesEvent } from '../../events/series';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { SeriesActivityService } from '../../notification/activities';
import { UserSharedDto } from '../../shared/user/dto';
import { ArticleService } from '../../modules/article/article.service';
import { ArticleHasBeenAdded } from '../../common/constants';
import { NotificationService } from '../../notification';

@Injectable()
export class SeriesAddedArticlesListener {
  private _logger = new Logger(SeriesAddedArticlesListener.name);

  public constructor(
    private readonly _articleService: ArticleService,
    private readonly _seriesService: SeriesService,
    private readonly _postSearchService: SearchService,
    private readonly _notificationService: NotificationService,
    private readonly _seriesActivityService: SeriesActivityService
  ) {}

  @On(SeriesAddedArticlesEvent)
  public async handler(event: SeriesAddedArticlesEvent): Promise<void> {
    this._logger.debug(`[SeriesAddedArticlesListener] ${JSON.stringify(event.payload)}`);

    const { seriesId } = event.payload;

    const series = await this._seriesService.findSeriesById(seriesId, {
      withArticleId: true,
    });

    this._notifyAddedArticle(event.payload).catch((ex) => this._logger.error(ex, ex?.stack));

    if (series) {
      const articles = series.articles.map((article) => ({
        id: article.id,
        zindex: article['PostSeriesModel'].zindex,
      }));

      this._postSearchService.updateAttributePostToSearch(series, {
        articles,
      });
    }
  }

  private async _notifyAddedArticle(data: {
    seriesId: string;
    articleIds: string[];
    actor: UserSharedDto;
  }): Promise<void> {
    const { seriesId, articleIds, actor } = data;

    const series = await this._seriesService.get(seriesId, actor, { withComment: false });
    const article = await this._articleService.get(articleIds[0], actor, { withComment: false });

    if (series.createdBy === article.createdBy) {
      return;
    } else {
      const isSendToArticleCreator = series.createdBy === actor.id;
      const activity = await this._seriesActivityService.createAddedActivity(series, article);

      this._notificationService.publishPostNotification({
        key: `${series.id}`,
        value: {
          actor,
          event: ArticleHasBeenAdded,
          data: activity,
          meta: {
            series: {
              isSendToArticleCreator: isSendToArticleCreator,
            },
          },
        },
      });
    }
  }
}
