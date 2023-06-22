import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindItemsBySeriesQuery } from './find-items-by-series.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { UserDto } from '../../../../v2-user/application';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { FindItemsBySeriesDto } from './find-items-by-series.dto';
import { ArticleEntity } from '../../../domain/model/content/article.entity';

@QueryHandler(FindItemsBySeriesQuery)
export class FindItemsBySeriesHandler
  implements IQueryHandler<FindItemsBySeriesQuery, FindItemsBySeriesDto>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async execute(query: FindItemsBySeriesQuery): Promise<FindItemsBySeriesDto> {
    const { seriesIds, authUser } = query.payload;
    const seriesEntities = (await this._contentRepo.findAll({
      where: {
        ids: seriesIds,
        groupArchived: false,
        excludeReportedByUserId: authUser.id,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeItems: true,
      },
    })) as SeriesEntity[];
    if (seriesEntities.length === 0) {
      return new FindItemsBySeriesDto({ series: [] });
    }

    const ids = this._getItemIds(seriesEntities);

    const entities = await this._getItems(ids, authUser);

    const series = [];
    seriesEntities.forEach((seriesEntity) => {
      const items = [];
      seriesEntity.get('itemIds').forEach((id) => {
        if (entities.has(id)) {
          const item = entities.get(id);
          items.push({
            id: item.getId(),
            title: item instanceof PostEntity ? item.get('content') : item.get('title'),
            type: item.getType(),
          });
        }
      });
      series.push({
        id: seriesEntity.getId(),
        title: seriesEntity.get('title'),
        type: seriesEntity.getType(),
        items,
      });
    });

    return new FindItemsBySeriesDto({
      series,
    });
  }

  private _getItemIds(seriesEntities: SeriesEntity[]): string[] {
    const ids = [];
    seriesEntities.forEach((series: SeriesEntity) => {
      ids.push(...series.get('itemIds'));
    });

    return ids;
  }

  private async _getItems(
    ids: string[],
    authUser: UserDto
  ): Promise<Map<string, PostEntity | ArticleEntity>> {
    const items = (await this._contentRepo.findAll({
      where: {
        ids,
        groupArchived: false,
        excludeReportedByUserId: authUser.id,
      },
      include: {
        mustIncludeGroup: true,
      },
    })) as (PostEntity | ArticleEntity)[];

    return new Map<string, PostEntity | ArticleEntity>(
      items.map((item) => {
        return [item.getId(), item];
      })
    );
  }
}
