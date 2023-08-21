import { SentryService } from '@app/sentry';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { SeriesHasBeenUpdated } from '../../../../../../common/constants';
import { ArrayHelper } from '../../../../../../common/helpers';
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

import { ProcessSeriesUpdatedCommand } from './process-series-updated.command';

@CommandHandler(ProcessSeriesUpdatedCommand)
export class ProcessSeriesUpdatedHandler
  implements ICommandHandler<ProcessSeriesUpdatedCommand, void>
{
  private _logger = new Logger(ProcessSeriesUpdatedHandler.name);

  public constructor(
    private _sentryService: SentryService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService //TODO improve interface later
  ) {}

  public async execute(command: ProcessSeriesUpdatedCommand): Promise<void> {
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

  private async _processNotification(command: ProcessSeriesUpdatedCommand): Promise<void> {
    try {
      const { before, after } = command.payload;
      const groups = await this._groupApplicationService.findAllByIds(
        uniq([...after.groupIds, ...before.groupIds])
      );

      const oldActivity = this._postActivityService.createPayload({
        id: before.id,
        title: before.title,
        content: null,
        contentType: before.type,
        setting: before.setting,
        audience: {
          groups: groups.filter((group) => before.groupIds.includes(group.id)),
        },
        actor: before.actor,
        createdAt: before.createdAt,
      });

      const updatedActivity = this._postActivityService.createPayload({
        id: after.id,
        title: after.title,
        content: null,
        contentType: after.type,
        setting: after.setting,
        audience: {
          groups: groups.filter((group) => after.groupIds.includes(group.id)),
        },
        actor: after.actor,
        createdAt: after.createdAt,
      });

      const { attachGroupIds } = after.state;

      if (!attachGroupIds.length) {
        return;
      }

      const newGroupAdminIds = await this._groupApplicationService.getGroupAdminIds(
        after.actor,
        attachGroupIds
      );

      const oldGroupAdminIds = await this._groupApplicationService.getGroupAdminIds(
        before.actor,
        before.groupIds
      );

      let filterGroupAdminIds = ArrayHelper.arrDifferenceElements<string>(
        newGroupAdminIds,
        oldGroupAdminIds
      );

      filterGroupAdminIds = filterGroupAdminIds.filter((id) => id !== after.actor.id);

      if (!filterGroupAdminIds.length) {
        return;
      }

      await this._notificationService.publishPostNotification({
        key: `${after.id}`,
        value: {
          actor: {
            id: after.actor.id,
          },
          event: SeriesHasBeenUpdated,
          data: updatedActivity,
          meta: {
            post: {
              oldData: oldActivity,
            },
            series: {
              targetUserIds: filterGroupAdminIds,
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
