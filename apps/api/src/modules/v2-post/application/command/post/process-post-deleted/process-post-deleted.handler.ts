import { CONTENT_TYPE } from '@beincom/constants';
import { SentryService } from '@libs/infra/sentry';
import { UserDto } from '@libs/service/user';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { InternalEventEmitterService } from '../../../../../../app/custom/event-emitter';
import { PostHasBeenDeleted } from '../../../../../../common/constants';
import { SeriesRemovedItemsEvent } from '../../../../../../events/series';
import { NotificationService } from '../../../../../../notification';
import { PostActivityService } from '../../../../../../notification/activities';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../../domain/repositoty-interface';
import { PostMessagePayload } from '../../../dto/message';

import { ProcessPostDeletedCommand } from './process-post-deleted.command';

@CommandHandler(ProcessPostDeletedCommand)
export class ProcessPostDeletedHandler implements ICommandHandler<ProcessPostDeletedCommand, void> {
  public constructor(
    private readonly _sentryService: SentryService,
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService //TODO improve interface later
  ) {}

  private readonly _logger = new Logger(ProcessPostDeletedHandler.name);

  public async execute(command: ProcessPostDeletedCommand): Promise<void> {
    const { before } = command.payload;
    const { id, actor, content, tags, type, groupIds, seriesIds, createdAt, updatedAt } = before;

    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesRemovedItemsEvent({
          items: [
            {
              id: id,
              title: null,
              content: content,
              type: type,
              createdBy: actor.id,
              groupIds: groupIds,
              createdAt: createdAt,
              updatedAt: updatedAt,
            },
          ],
          seriesId: seriesId,
          actor: actor,
          contentIsDeleted: true,
        })
      );
    }

    try {
      if (tags?.length) {
        const tagEntities = await this._tagRepository.findAll({ ids: tags.map((tag) => tag.id) });
        for (const tag of tagEntities) {
          if (tag.get('totalUsed') > 0) {
            tag.decreaseTotalUsed();
            await this._tagRepository.update(tag);
          }
        }
      }
      await this._processNotification(before, actor);
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }

  private async _processNotification(
    post: Omit<PostMessagePayload, 'media' | 'communityIds'>,
    actor: UserDto
  ): Promise<void> {
    const activity = this._postActivityService.createPayload({
      title: null,
      actor: actor,
      content: post.content,
      createdAt: post.createdAt,
      setting: {
        canComment: post.setting.canComment,
        canReact: post.setting.canReact,
        isImportant: post.setting.isImportant,
      },
      id: post.id,
      audience: {
        groups: (post.groupIds ?? []).map((id) => ({ id })),
      },
      contentType: CONTENT_TYPE.POST,
      mentions: post.mentionUserIds as any,
    });

    await this._notificationService.publishPostNotification({
      key: `${post.id}`,
      value: {
        actor: {
          id: actor.id,
        },
        event: PostHasBeenDeleted,
        data: activity,
      },
    });
  }
}
