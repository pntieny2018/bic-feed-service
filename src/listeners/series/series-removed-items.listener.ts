import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { SeriesRemovedItemsEvent } from '../../events/series';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';

@Injectable()
export class SeriesRemovedItemsListener {
  private _logger = new Logger(SeriesRemovedItemsListener.name);

  public constructor(
    private readonly _seriesService: SeriesService,
    private readonly _postSearchService: SearchService
  ) {}

  @On(SeriesRemovedItemsEvent)
  public async handler(event: SeriesRemovedItemsEvent): Promise<void> {
    this._logger.debug(`[SeriesRemovedItemsListener] ${JSON.stringify(event.payload)}`);
    const { seriesId, itemIds } = event.payload;
    const series = await this._seriesService.findSeriesById(seriesId, {
      withItemId: true,
    });
    if (series) {
      const items = series.items.map((item) => ({
        id: item.id,
        zindex: item['PostSeriesModel'].zindex,
      }));
      this._postSearchService.updateAttributePostToSearch(series, {
        items,
      });
    }
  }
}
