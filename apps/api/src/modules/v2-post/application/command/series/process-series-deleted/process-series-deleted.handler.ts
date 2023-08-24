import { SentryService } from '@app/sentry';
import { CONTENT_TYPE } from '@beincom/constants';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SeriesHasBeenDeleted } from '../../../../../../common/constants';
import { StringHelper } from '../../../../../../common/helpers';
import { NotificationService, TypeActivity, VerbActivity } from '../../../../../../notification';
import { NotificationActivity } from '../../../../../../notification/dto/requests/notification-activity.dto';
import { SearchService } from '../../../../../search/search.service';
import { PostEntity } from '../../../../domain/model/content';
import { ArticleEntity } from '../../../../domain/model/content/article.entity';
import { ContentEntity } from '../../../../domain/model/content/content.entity';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { SeriesMessagePayload } from '../../../dto/message/series.message-payload';

import { ProcessSeriesDeletedCommand } from './process-series-deleted.command';

@CommandHandler(ProcessSeriesDeletedCommand)
export class ProcessSeriesDeletedHandler
  implements ICommandHandler<ProcessSeriesDeletedCommand, void>
{
  private _logger = new Logger(ProcessSeriesDeletedHandler.name);

  public constructor(
    private _sentryService: SentryService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private readonly _postSearchService: SearchService,
    private readonly _notificationService: NotificationService //TODO improve interface later
  ) {}

  public async execute(command: ProcessSeriesDeletedCommand): Promise<void> {
    const { before } = command.payload;

    const { actor, itemIds, isHidden } = before;

    if (!itemIds || !itemIds.length) {
      return;
    }

    if (!isHidden) {
      const items = (await this._contentRepository.findAll({
        where: {
          ids: itemIds,
          groupArchived: false,
        },
        include: {
          shouldIncludeGroup: true,
          shouldIncludeSeries: true,
        },
      })) as (PostEntity | ArticleEntity)[];

      await this._postSearchService.updateSeriesAtrributeForPostSearch(itemIds);

      if (items.every((item) => item.isOwner(actor.id))) {
        return;
      }

      await this._processNotification(before, items);
    }
  }

  private async _processNotification(
    series: SeriesMessagePayload,
    items: ContentEntity[]
  ): Promise<void> {
    try {
      const { id, actor, type, groupIds, title, createdAt, updatedAt } = series;

      const existingCreator = new Set([]);
      const filterItems = [];
      for (const item of items) {
        if (!existingCreator.has(item.get('createdBy')) && item.get('createdBy') !== actor.id) {
          filterItems.push({
            id: item.get('id'),
            title:
              item.get('type') === CONTENT_TYPE.ARTICLE
                ? (item as ArticleEntity).get('title')
                : null,
            contentType: item.get('type').toLowerCase(),
            actor: { id: item.get('createdBy') },
            audience: {
              groups: (item.get('groupIds') || []).map((groupId) => ({ id: groupId })),
            },
            content:
              item.get('type') === CONTENT_TYPE.POST
                ? StringHelper.removeMarkdownCharacter((item as PostEntity).get('content'))
                : null,
            createdAt: item.get('createdAt'),
            updatedAt: item.get('updatedAt'),
          });
          existingCreator.add(item.get('createdBy'));
        }
      }
      const activityObject = {
        id,
        title,
        contentType: type.toLowerCase(),
        actor: { id: series.actor.id },
        audience: {
          groups: (groupIds || []).map((groupId) => ({ id: groupId })),
        },
        items: filterItems,
        createdAt,
        updatedAt,
      };

      const activity = new NotificationActivity(
        activityObject,
        VerbActivity.DELETE,
        TypeActivity.SERIES,
        new Date(),
        new Date()
      );

      await this._notificationService.publishPostNotification({
        key: `${id}`,
        value: {
          actor: {
            id: actor.id,
          },
          event: SeriesHasBeenDeleted,
          data: activity,
          meta: {
            series: {
              targetUserIds: [],
            },
          },
        },
      });
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }
}
