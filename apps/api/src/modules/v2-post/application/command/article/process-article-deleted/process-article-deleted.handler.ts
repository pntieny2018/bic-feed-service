import { SentryService } from '@libs/infra/sentry';
import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { InternalEventEmitterService } from '../../../../../../app/custom/event-emitter';
import { ArticleHasBeenDeleted } from '../../../../../../common/constants';
import { SeriesRemovedItemsEvent } from '../../../../../../events/series';
import { NotificationService } from '../../../../../../notification';
import { PostActivityService } from '../../../../../../notification/activities';
import { ArticleMessagePayload } from '../../../dto/message';

import { ProcessArticleDeletedCommand } from './process-article-deleted.command';

@CommandHandler(ProcessArticleDeletedCommand)
export class ProcessArticleDeletedHandler
  implements ICommandHandler<ProcessArticleDeletedCommand, void>
{
  private _logger = new Logger(ProcessArticleDeletedHandler.name);

  public constructor(
    private readonly _sentryService: SentryService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService //TODO improve interface later
  ) {}

  public async execute(command: ProcessArticleDeletedCommand): Promise<void> {
    const { before } = command.payload;
    const { id, actor, type, groupIds, seriesIds, content, title, createdAt, updatedAt } = before;

    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesRemovedItemsEvent({
          items: [
            {
              id: id,
              title: title,
              content: content,
              type: type,
              createdBy: actor.id,
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

    try {
      await this._processNotification(before);
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }

  private async _processNotification(
    articlePayload: Omit<ArticleMessagePayload, 'tags'>
  ): Promise<void> {
    const { id, setting, type, groupIds, title, content, createdAt, actor } = articlePayload;

    const activity = this._postActivityService.createPayload({
      id,
      actor,
      title,
      content,
      contentType: type,
      createdAt,
      setting: {
        canComment: setting.canComment,
        canReact: setting.canReact,
        isImportant: setting.isImportant,
      },
      audience: {
        groups: (groupIds ?? []).map((id) => ({ id })),
      },
    });

    await this._notificationService.publishPostNotification({
      key: `${id}`,
      value: {
        actor: {
          id: actor.id,
        },
        event: ArticleHasBeenDeleted,
        data: activity,
      },
    });
  }
}
