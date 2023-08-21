import { SentryService } from '@app/sentry';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SeriesHasBeenPublished } from '../../../../../../common/constants';
import { NotificationService } from '../../../../../../notification';
import { PostActivityService } from '../../../../../../notification/activities';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import { SeriesEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';

import { ProcessSeriesPublishedCommand } from './process-series-published.command';

@CommandHandler(ProcessSeriesPublishedCommand)
export class ProcessSeriesPublishedHandler
  implements ICommandHandler<ProcessSeriesPublishedCommand, void>
{
  private _logger = new Logger(ProcessSeriesPublishedHandler.name);

  public constructor(
    private _sentryService: SentryService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService //TODO improve interface later
  ) {}

  public async execute(command: ProcessSeriesPublishedCommand): Promise<void> {
    const { after } = command.payload;

    const seriesEntity = await this._contentRepository.findOne({
      where: {
        id: after.id,
        groupArchived: false,
      },
    });

    if (!seriesEntity) {
      return;
    }
    if (seriesEntity instanceof SeriesEntity) {
      if (!seriesEntity.isHidden()) {
        await this._processNotification(command);
      }
    }
  }

  private async _processNotification(command: ProcessSeriesPublishedCommand): Promise<void> {
    try {
      const { after } = command.payload;
      const groups = await this._groupApplicationService.findAllByIds(after.groupIds);
      const activity = this._postActivityService.createPayload({
        id: after.id,
        title: after.title,
        content: null,
        contentType: after.type,
        setting: after.setting,
        audience: {
          groups,
        },
        actor: after.actor,
        createdAt: after.createdAt,
      });

      let groupAdminIds = await this._groupApplicationService.getGroupAdminIds(
        after.actor,
        after.groupIds
      );

      groupAdminIds = groupAdminIds.filter((id) => id !== after.actor.id);

      if (groupAdminIds.length) {
        await this._notificationService.publishPostNotification({
          key: `${after.id}`,
          value: {
            actor: {
              id: after.actor.id,
            },
            event: SeriesHasBeenPublished,
            data: activity,
            meta: {
              series: {
                targetUserIds: groupAdminIds,
              },
            },
          },
        });
      }
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }
}
