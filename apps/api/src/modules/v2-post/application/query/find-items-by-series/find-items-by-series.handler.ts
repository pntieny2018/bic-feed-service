import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { FindItemsBySeriesQuery } from './find-items-by-series.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { FindItemsBySeriesDto } from './find-items-by-series.dto';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import { ArticleEntity } from '../../../domain/model/content/article.entity';

@QueryHandler(FindItemsBySeriesQuery)
export class FindItemsBySeriesHandler
  implements IQueryHandler<FindItemsBySeriesQuery, FindItemsBySeriesDto>
{
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepo: IContentRepository;
  @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator;
  @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding;
  @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery;

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
      items
        .filter((item) => !item.isHidden() && item.isPublished())
        .map((item) => {
          return [item.getId(), item];
        })
    );
  }
}
