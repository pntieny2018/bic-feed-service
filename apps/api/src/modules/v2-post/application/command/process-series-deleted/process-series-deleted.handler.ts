import { SentryService } from '@app/sentry';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { PostEntity } from '../../../domain/model/content';
import { SeriesHasBeenDeleted } from '../../../../../common/constants';
import { NotificationService, TypeActivity, VerbActivity } from '../../../../../notification';
import { PostType } from '../../../data-type';
import { StringHelper } from '../../../../../common/helpers';
import { NotificationActivity } from '../../../../../notification/dto/requests/notification-activity.dto';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import { ProcessSeriesDeletedCommand } from './process-series-deleted.command';
import { ArticleEntity } from '../../../domain/model/content/article.entity';
import { SeriesMessagePayload } from '../../dto/message/series.message-payload';

@CommandHandler(ProcessSeriesDeletedCommand)
export class ProcessSeriesDeletedHandler
  implements ICommandHandler<ProcessSeriesDeletedCommand, void>
{
  private _logger = new Logger(ProcessSeriesDeletedHandler.name);

  public constructor(
    private _sentryService: SentryService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private readonly _notificationService: NotificationService //TODO improve interface later
  ) {}

  public async execute(command: ProcessSeriesDeletedCommand): Promise<void> {
    const { before } = command.payload;

    const { actor, itemIds, isHidden } = before;

    if (!itemIds || !itemIds.length) return;

    if (!isHidden) {
      const items = await this._contentRepository.findAll({
        where: {
          ids: itemIds,
        },
      });

      if (items.every((item) => item.isOwner(actor.id))) return;

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
              item.get('type') === PostType.ARTICLE ? (item as ArticleEntity).get('title') : null,
            contentType: item.get('type').toLowerCase(),
            actor: { id: item.get('createdBy') },
            audience: {
              groups: item.get('groupIds').map((groupId) => ({ id: groupId })),
            },
            content:
              item.get('type') === PostType.POST
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
          groups: groupIds.map((groupId) => ({ id: groupId })),
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
