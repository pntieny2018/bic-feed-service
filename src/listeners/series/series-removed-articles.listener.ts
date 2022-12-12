import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { SeriesRemovedArticlesEvent } from '../../events/series';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';

@Injectable()
export class SeriesRemovedArticlesListener {
  private _logger = new Logger(SeriesRemovedArticlesListener.name);

  public constructor(
    private readonly _seriesService: SeriesService,
    private readonly _postSearchService: SearchService
  ) {}

  @On(SeriesRemovedArticlesEvent)
  public async handler(event: SeriesRemovedArticlesEvent): Promise<void> {
    this._logger.debug(`[SeriesRemovedArticlesListener] ${JSON.stringify(event.payload)}`);
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
