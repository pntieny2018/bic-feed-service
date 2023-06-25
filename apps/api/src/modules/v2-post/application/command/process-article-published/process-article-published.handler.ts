import { SentryService } from '@app/sentry';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { ArticleHasBeenPublished } from '../../../../../common/constants';
import { NotificationService } from '../../../../../notification';
import { PostActivityService } from '../../../../../notification/activities';
import { ProcessArticlePublishedCommand } from './process-article-Published.command';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { SeriesAddedItemsEvent } from '../../../../../events/series';
import { ArticleMessagePayload } from '../../dto/message/article.message-payload';

@CommandHandler(ProcessArticlePublishedCommand)
export class ProcessArticlePublishedHandler
  implements ICommandHandler<ProcessArticlePublishedCommand, void>
{
  private _logger = new Logger(ProcessArticlePublishedHandler.name);

  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    private readonly _sentryService: SentryService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService //TODO improve interface later
  ) {}

  public async execute(command: ProcessArticlePublishedCommand): Promise<void> {
    const { after } = command.payload;
    const { id, actor, tags, seriesIds } = after || {};

    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesAddedItemsEvent({
          itemIds: [id],
          seriesId: seriesId,
          actor,
          context: 'publish',
        })
      );
    }

    try {
      if (tags?.length) {
        const tagEntities = await this._tagRepository.findAll({ ids: tags.map((tag) => tag.id) });
        for (const tag of tagEntities) {
          tag.increaseTotalUsed();
          await this._tagRepository.update(tag);
        }
      }
      await this._processNotification(after);
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }

  private async _processNotification(articlePayload: ArticleMessagePayload): Promise<void> {
    const { id, series, setting, type, groupIds, title, content, createdAt, actor } =
      articlePayload;

    const activity = this._postActivityService.createPayload({
      id,
      actor: {
        id: actor.id,
      },
      title,
      content,
      contentType: type,
      setting: {
        canComment: setting.canComment,
        canReact: setting.canReact,
        isImportant: setting.isImportant,
      },
      audience: {
        groups: (groupIds ?? []).map((id) => ({ id })),
      },
      createdAt,
    });

    await this._notificationService.publishPostNotification({
      key: `${id}`,
      value: {
        actor: {
          id: actor.id,
        },
        event: ArticleHasBeenPublished,
        data: activity,
        meta: {
          post: {
            ignoreUserIds: series?.map((series) => series.createdBy),
          },
        },
      },
    });
  }
}
