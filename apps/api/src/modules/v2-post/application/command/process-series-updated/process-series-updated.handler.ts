import { uniq } from 'lodash';
import { Inject } from '@nestjs/common';
import { ArrayHelper } from '../../../../../common/helpers';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProcessSeriesUpdatedCommand } from './process-series-updated.command';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { SeriesEntity } from '../../../domain/model/content';
import { SeriesHasBeenUpdated } from '../../../../../common/constants';
import { NotificationService } from '../../../../../notification';
import { PostActivityService } from '../../../../../notification/activities';

@CommandHandler(ProcessSeriesUpdatedCommand)
export class ProcessSeriesUpdatedHandler
  implements ICommandHandler<ProcessSeriesUpdatedCommand, void>
{
  public constructor(
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

    if (!seriesEntity) return;
    if (seriesEntity instanceof SeriesEntity) {
      if (!seriesEntity.isHidden()) {
        await this._processNotification(command);
      }
    }
  }

  private async _processNotification(command: ProcessSeriesUpdatedCommand): Promise<void> {
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

    if (!attachGroupIds.length) return;

    const newGroupAdminIds = await this._groupApplicationService.getGroupAdminIds(
      after.actor,
      attachGroupIds
    );

    const oldGroupAdminIds = await this._groupApplicationService.getGroupAdminIds(
      after.actor,
      before.groupIds
    );

    let filterGroupAdminIds = ArrayHelper.arrDifferenceElements<string>(
      newGroupAdminIds,
      oldGroupAdminIds
    );

    filterGroupAdminIds = filterGroupAdminIds.filter((id) => id !== after.actor.id);

    if (!filterGroupAdminIds.length) return;

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
  }
}
