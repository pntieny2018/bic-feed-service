import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { ArticleHasBeenDeleted } from '../../../../../common/constants';
import { NotificationService, TypeActivity, VerbActivity } from '../../../../../notification';
import {
  ActivityObject,
  NotificationActivity,
} from '../../../../../notification/dto/requests/notification-activity.dto';
import { ProcessArticleDeletedCommand } from './process-article-deleted.command';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { SeriesRemovedItemsEvent } from 'apps/api/src/events/series';
import { ArticleMessagePayload } from '../../dto/message/article.message-payload';

@CommandHandler(ProcessArticleDeletedCommand)
export class ProcessArticleDeletedHandler
  implements ICommandHandler<ProcessArticleDeletedCommand, void>
{
  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService //TODO improve interface later
  ) {}

  public async execute(command: ProcessArticleDeletedCommand): Promise<void> {
    const { before } = command.payload;
    const {
      id,
      actor,
      type,
      groupIds,
      tags,
      seriesIds,
      content,
      title,
      createdAt,
      updatedAt,
      createdBy,
    } = before;

    if (tags?.length) {
      const tagEntities = await this._tagRepository.findAll({ ids: tags.map((tag) => tag.id) });
      for (const tag of tagEntities) {
        tag.decreaseTotalUsed();
        await this._tagRepository.update(tag);
      }
    }

    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesRemovedItemsEvent({
          items: [
            {
              id: id,
              title: title,
              content: content,
              type: type,
              createdBy: createdBy,
              groupIds: groupIds,
              createdAt: createdAt,
              updatedAt: updatedAt,
            },
          ],
          seriesId: seriesId,
          actor,
          contentIsDeleted: true,
        })
      );
    }

    await this._processNotification(before);
  }

  private async _processNotification(articlePayload: ArticleMessagePayload): Promise<void> {
    const { id, setting, type, groupIds, title, content, createdAt, updatedAt, createdBy } =
      articlePayload;

    const activityObject: ActivityObject = {
      id,
      setting,
      title,
      content,
      contentType: type,
      actor: { id: createdBy },
      audience: {
        groups: groupIds.map((groupId) => ({ id: groupId })),
      },
      createdAt: createdAt,
      updatedAt: updatedAt,
    };

    const activity = new NotificationActivity(
      activityObject,
      VerbActivity.DELETE,
      TypeActivity.ARTICLE,
      new Date(),
      new Date()
    );

    await this._notificationService.publishPostNotification({
      key: `${id}`,
      value: {
        actor: {
          id: createdBy,
        },
        event: ArticleHasBeenDeleted,
        data: activity,
      },
    });
  }
}
