import { RootGroupRequestDto } from '@api/modules/v2-post/driving-apdater/dto/request';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { differenceInWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { filter, keyBy, mapValues } from 'lodash';

import { SearchService } from '../../../../../search/search.service';

import { CountContentPerWeekQuery } from './count-content-per-week.query';

@QueryHandler(CountContentPerWeekQuery)
export class CountContentPerWeekHandler
  implements IQueryHandler<CountContentPerWeekQuery, Record<string, number>>
{
  public constructor(private readonly _postSearchService: SearchService) {}

  private readonly defaultNumberOfWeeks = 12;

  public async execute(query: CountContentPerWeekQuery): Promise<Record<string, number>> {
    const rootGroupIds = query.payload.rootGroups.map((rootGroup) => rootGroup.id);

    const response = await this._postSearchService.countContentsInCommunity({
      startTime: this._getStartDateTwelveWeeksAgo(),
      endTime: new Date().toISOString(),
      rootGroupIds,
    });

    const filteredArray = keyBy(
      filter(response, (item) => rootGroupIds.includes(item.key)),
      'key'
    );
    const formattedCreatedAt = this._formatCreatedAttoWeekAgo(query.payload.rootGroups);

    return mapValues(filteredArray, (value) => {
      const weekAgo =
        formattedCreatedAt[value.key] < this.defaultNumberOfWeeks
          ? formattedCreatedAt[value.key]
          : this.defaultNumberOfWeeks;
      return Math.ceil(Number(value.doc_count / weekAgo));
    });
  }

  private _getStartDateTwelveWeeksAgo(): string {
    const twelveWeeksAgo = subWeeks(new Date(), this.defaultNumberOfWeeks - 1);
    const startOfWeekTwelveWeeksAgo = startOfWeek(twelveWeeksAgo, { weekStartsOn: 1 });

    return format(startOfWeekTwelveWeeksAgo, "yyyy-MM-dd'T'HH:mm:ss.SSSX");
  }

  private _formatCreatedAttoWeekAgo(rootGroups: RootGroupRequestDto[]): Record<string, number> {
    return rootGroups.reduce((acc, rootGroup) => {
      const groupCreatedAt = new Date(rootGroup.createdAt);
      const weekStart = startOfWeek(groupCreatedAt, { weekStartsOn: 1 });

      const today = new Date();
      const weeksSinceCreated = differenceInWeeks(today, weekStart);

      return { ...acc, [rootGroup.id]: weeksSinceCreated + 1 };
    }, {});
  }
}
