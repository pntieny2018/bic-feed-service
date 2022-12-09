import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { SeriesAddedArticlesEvent } from '../../events/series';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';

@Injectable()
export class SeriesAddedArticlesListener {
  private _logger = new Logger(SeriesAddedArticlesListener.name);

  public constructor(
    private readonly _seriesService: SeriesService,
    private readonly _postSearchService: SearchService
  ) {}

  @On(SeriesAddedArticlesEvent)
  public async handler(event: SeriesAddedArticlesEvent): Promise<void> {
    this._logger.debug(`[SeriesAddedArticlesListener] ${JSON.stringify(event.payload)}`);
    const { seriesId, articleIds } = event.payload;
    const series = await this._seriesService.findSeriesById(seriesId, {
      withArticleId: true,
    });
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
}
