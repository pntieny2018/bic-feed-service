import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ProcessSeriesPublishedCommand } from './process-series-published.command';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { PostEntity, SeriesEntity } from '../../../domain/model/content';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { MediaService } from '../../../../media';
import { MediaMarkAction, MediaType } from '../../../../../database/models/media.model';
import {
  PostHasBeenPublished,
  PostHasBeenUpdated,
  SeriesHasBeenPublished,
  SeriesHasBeenUpdated,
} from '../../../../../common/constants';
import { NotificationService } from '../../../../../notification';
import { PostActivityService } from '../../../../../notification/activities';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { SeriesAddedItemsEvent } from '../../../../../events/series';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/media.domain-service.interface';

@CommandHandler(ProcessSeriesPublishedCommand)
export class ProcessSeriesPublishedHandler
  implements ICommandHandler<ProcessSeriesPublishedCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN) private readonly _mediaDomainService: IMediaDomainService,
    private readonly _notificationService: NotificationService, //TODO improve interface later
    private readonly _postActivityService: PostActivityService, //TODO improve interface later
    private readonly _internalEventEmitter: InternalEventEmitterService //TODO improve interface later
  ) {}

  public async execute(command: ProcessSeriesPublishedCommand): Promise<void> {
    const { before, after } = command.payload;

    const seriesEntity = await this._contentRepository.findOne({
      where: {
        id: after.id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeItems: true,
      },
    });

    if (!seriesEntity) return;
    if (seriesEntity instanceof SeriesEntity) {
      if (!seriesEntity.isHidden()) {
        await this._processNotification(command);
      }
    }
  }

  private async _processNotification(command: ProcessSeriesPublishedCommand): Promise<void> {
    const { after, state } = command.payload;
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
          event: state === 'publish' ? SeriesHasBeenPublished : SeriesHasBeenUpdated,
          data: activity,
          meta: {
            series: {
              targetUserIds: groupAdminIds,
            },
          },
        },
      });
    }
  }
}
