import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateSeriesCommand } from './update-series.command';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  AccessDeniedException,
  ContentEmptyGroupException,
  ContentNotFoundException,
  SeriesRequiredCoverException,
} from '../../../domain/exception';
import {
  IPostDomainService,
  ISeriesDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { SeriesEntity } from '../../../domain/model/content';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { SeriesDto } from '../../dto';
import { KAFKA_TOPIC } from '@app/kafka/kafka.constant';
import { cloneDeep } from 'lodash';
import { KafkaService } from '@app/kafka';
import { SeriesChangedMessagePayload } from '../../dto/message';

@CommandHandler(UpdateSeriesCommand)
export class UpdateSeriesHandler implements ICommandHandler<UpdateSeriesCommand, SeriesDto> {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    private readonly _kafkaService: KafkaService
  ) {}

  public async execute(command: UpdateSeriesCommand): Promise<SeriesDto> {
    const { actor, id, groupIds, coverMedia } = command.payload;

    const seriesEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeItems: true,
        shouldIncludeMarkReadImportant: {
          userId: actor?.id,
        },
        shouldIncludeSaved: {
          userId: actor.id,
        },
      },
    });

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }

    const isImportantBefore = seriesEntity.isImportant();

    if (!seriesEntity.isOwner(actor.id)) throw new AccessDeniedException();

    if (coverMedia && !coverMedia.id) throw new SeriesRequiredCoverException();

    if (groupIds && groupIds.length === 0) throw new ContentEmptyGroupException();

    const seriesEntityBefore = cloneDeep(seriesEntity);

    let groups: GroupDto[] = [];
    if (groupIds?.length) {
      groups = await this._groupAppService.findAllByIds(groupIds);
    }

    await this._seriesDomainService.update({
      seriesEntity,
      groups,
      newData: command.payload,
    });

    if (!isImportantBefore && seriesEntity.isImportant()) {
      await this._postDomainService.markReadImportant(seriesEntity, actor.id);
      seriesEntity.setMarkReadImportant();
    }

    const result = await this._contentBinding.seriesBinding(seriesEntity, {
      actor,
      groups,
      authUser: actor,
    });

    this._sendEvent(seriesEntityBefore, seriesEntity, result);

    return result;
  }

  private _sendEvent(
    entityBefore: SeriesEntity,
    entityAfter: SeriesEntity,
    result: SeriesDto
  ): void {
    if (entityAfter.isPublished()) {
      const payload: SeriesChangedMessagePayload = {
        state: 'update',
        before: {
          id: entityBefore.get('id'),
          actor: result.actor,
          setting: entityBefore.get('setting'),
          type: entityBefore.get('type'),
          groupIds: entityBefore.get('groupIds'),
          title: entityBefore.get('title'),
          summary: entityBefore.get('summary'),
          lang: entityBefore.get('lang'),
          isHidden: entityBefore.get('isHidden'),
          status: entityBefore.get('status'),
          createdAt: entityBefore.get('createdAt'),
          updatedAt: entityBefore.get('updatedAt'),
        },
        after: {
          id: entityAfter.get('id'),
          actor: result.actor,
          setting: result.setting,
          type: entityAfter.get('type'),
          groupIds: entityAfter.get('groupIds'),
          communityIds: result.communities.map((community) => community.id),
          title: entityAfter.get('title'),
          summary: entityAfter.get('summary'),
          lang: entityAfter.get('lang'),
          isHidden: entityAfter.get('isHidden'),
          status: entityAfter.get('status'),
          coverMedia: result.coverMedia,
          state: {
            attachGroupIds: entityAfter.getState().attachGroupIds,
            detachGroupIds: entityAfter.getState().detachGroupIds,
          },
          createdAt: entityAfter.get('createdAt'),
          updatedAt: entityAfter.get('updatedAt'),
          publishedAt: entityAfter.get('publishedAt'),
        },
      };

      this._kafkaService.emit(KAFKA_TOPIC.CONTENT.SERIES_CHANGED, {
        key: entityAfter.getId(),
        value: new SeriesChangedMessagePayload(payload),
      });
    }
  }
}
