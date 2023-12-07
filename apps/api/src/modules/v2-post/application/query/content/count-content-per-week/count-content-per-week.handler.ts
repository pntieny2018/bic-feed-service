import { SearchService } from '@api/modules/search/search.service';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { filter, keyBy, mapValues } from 'lodash';

import { CountContentPerWeekQuery } from './count-content-per-week.query';

@QueryHandler(CountContentPerWeekQuery)
export class CountContentPerWeekHandler
  implements IQueryHandler<CountContentPerWeekQuery, Record<string, number>>
{
  public constructor(private readonly _postSearchService: SearchService) {}

  private readonly numberOfWeeks = 12;

  public async execute(query: CountContentPerWeekQuery): Promise<Record<string, number>> {
    const response = await this._postSearchService.countContentsInCommunity({
      startTime: this.getStartDateTwelveWeeksAgo(),
      endTime: new Date().toISOString(),
      rootGroupIds: query.payload.rootGroupIds,
    });

    const filteredArray = keyBy(
      filter(response, (item) => query.payload.rootGroupIds.includes(item.key)),
      'key'
    );
    return mapValues(filteredArray, (value) =>
      Number((value.doc_count / this.numberOfWeeks).toFixed(2))
    );
  }

  private getStartDateTwelveWeeksAgo(): string {
    const twelveWeeksAgo = subWeeks(new Date(), this.numberOfWeeks - 1);
    const startOfWeekTwelveWeeksAgo = startOfWeek(twelveWeeksAgo, { weekStartsOn: 1 });

    return format(startOfWeekTwelveWeeksAgo, "yyyy-MM-dd'T'HH:mm:ss.SSSX");
  }
}
