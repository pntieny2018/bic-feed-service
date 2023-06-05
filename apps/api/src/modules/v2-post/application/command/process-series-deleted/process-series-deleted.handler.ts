import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { SeriesHasBeenDeleted } from '../../../../../common/constants';
import { NotificationService, TypeActivity, VerbActivity } from '../../../../../notification';
import { PostType } from '../../../data-type';
import { StringHelper } from 'apps/api/src/common/helpers';
import { NotificationActivity } from 'apps/api/src/notification/dto/requests/notification-activity.dto';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import { ProcessSeriesDeletedCommand } from './process-series-deleted.command';

@CommandHandler(ProcessSeriesDeletedCommand)
export class ProcessSeriesPublishedHandler
  implements ICommandHandler<ProcessSeriesDeletedCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository,
    private readonly _notificationService: NotificationService //TODO improve interface later
  ) {}

  public async execute(command: ProcessSeriesDeletedCommand): Promise<void> {
    const { before } = command.payload;

    const seriesEntity = (await this._contentRepository.findOne({
      where: {
        id: before.id,
        groupArchived: false,
        type: PostType.SERIES,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeItems: true,
      },
    })) as SeriesEntity;

    if (!seriesEntity || !seriesEntity.get('itemIds').length) return;

    if (!seriesEntity.isHidden()) {
      const itemsSorted = seriesEntity.get('itemIds');
      const items = await this._contentRepository.findAll({
        where: {
          ids: itemsSorted,
        },
      });

      if (items.every((item) => item.isOwner(seriesEntity.get('createdBy')))) return;

      await this._processNotification(seriesEntity, items);
    }
  }

  private async _processNotification(series: SeriesEntity, items: ContentEntity[]): Promise<void> {
    const existingCreator = new Set([]);
    const filterItems = [];
    for (const item of items) {
      if (
        !existingCreator.has(item.get('createdBy')) &&
        item.get('createdBy') !== series.get('createdBy')
      ) {
        filterItems.push({
          id: item.get('id'),
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
      id: series.get('id'),
      title: series.get('title'),
      contentType: series.get('type').toLowerCase(),
      actor: { id: series.get('createdBy') },
      audience: {
        groups: series.get('groupIds').map((groupId) => ({ id: groupId })),
      },
      items: filterItems,
      createdAt: series.get('createdAt'),
      updatedAt: series.get('updatedAt'),
    };

    const activity = new NotificationActivity(
      activityObject,
      VerbActivity.DELETE,
      TypeActivity.SERIES,
      new Date(),
      new Date()
    );

    await this._notificationService.publishPostNotification({
      key: `${series.get('id')}`,
      value: {
        actor: {
          id: series.get('createdBy'),
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
  }
}
