import { Injectable, Logger } from '@nestjs/common';

import { On } from '../../common/decorators';
import { SeriesReoderItemsEvent } from '../../events/series';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';

@Injectable()
export class SeriesReorderItemsListener {
  private _logger = new Logger(SeriesReorderItemsListener.name);

  public constructor(
    private readonly _seriesService: SeriesService,
    private readonly _postSearchService: SearchService
  ) {}

  @On(SeriesReoderItemsEvent)
  public async handler(event: SeriesReoderItemsEvent): Promise<void> {
    this._logger.debug(`[SeriesReorderItemsListener] ${JSON.stringify(event.payload)}`);
    const { seriesId } = event.payload;
    const series = await this._seriesService.findSeriesById(seriesId, {
      withItems: true,
    });
    if (series) {
      const items = series.items.map((item) => ({
        id: item.id,
        zindex: item['PostSeriesModel'].zindex,
      }));
      await this._postSearchService.updateAttributePostToSearch(series, {
        items: items.sort((a, b) => {
          return a.zindex - b.zindex;
        }),
      });
    }
  }
}
