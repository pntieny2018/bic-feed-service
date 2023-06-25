import { uniq } from 'lodash';
import { SentryService } from '@app/sentry';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  ITagRepository,
  TAG_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { ArticleHasBeenUpdated } from '../../../../../common/constants';
import { NotificationService } from '../../../../../notification';
import { PostActivityService } from '../../../../../notification/activities';
import { ProcessArticleUpdatedCommand } from './process-article-updated.command';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { SeriesAddedItemsEvent } from '../../../../../events/series';
import { ArticleMessagePayload } from '../../dto/message/article.message-payload';
import { SeriesEntity } from '../../../domain/model/content';

@CommandHandler(ProcessArticleUpdatedCommand)
export class ProcessArticleUpdatedHandler
  implements ICommandHandler<ProcessArticleUpdatedCommand, void>
{
  private _logger = new Logger(ProcessArticleUpdatedHandler.name);

  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private readonly _sentryService: SentryService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService //TODO improve interface later
  ) {}

  public async execute(command: ProcessArticleUpdatedCommand): Promise<void> {
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
      const seriesEntites = (await this._contentRepository.findAll({
        attributes: {
          include: ['content'],
        },
        where: {
          groupArchived: false,
          isHidden: false,
          ids: seriesIds,
        },
      })) as SeriesEntity[];
      const seriesActors = uniq(seriesEntites.map((series) => series.get('createdBy')));

      await this._processNotification({
        ...after,
        seriesActors,
      });
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }

  private async _processNotification(articlePayload: ArticleMessagePayload): Promise<void> {
    const { id, seriesActors, setting, type, groupIds, title, content, createdAt, actor } =
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
        event: ArticleHasBeenUpdated,
        data: activity,
        meta: {
          post: {
            ignoreUserIds: seriesActors,
          },
        },
      },
    });
  }
}
