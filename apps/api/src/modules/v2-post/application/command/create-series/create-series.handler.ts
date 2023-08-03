import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateSeriesCommand } from './create-series.command';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  ContentEmptyGroupException,
  SeriesRequiredCoverException,
} from '../../../domain/exception';
import {
  IPostDomainService,
  ISeriesDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { SeriesEntity } from '../../../domain/model/content';
import { CreateSeriesDto, SeriesDto } from '../../dto';
import { KafkaService, KAFKA_TOPIC } from '@app/kafka';
import { SeriesChangedMessagePayload } from '../../dto/message';

@CommandHandler(CreateSeriesCommand)
export class CreateSeriesHandler implements ICommandHandler<CreateSeriesCommand, CreateSeriesDto> {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    private readonly _kafkaService: KafkaService
  ) {}

  public async execute(command: CreateSeriesCommand): Promise<CreateSeriesDto> {
    const { actor, groupIds, coverMedia } = command.payload;

    if (!groupIds || groupIds.length === 0) throw new ContentEmptyGroupException();

    if (!coverMedia || !coverMedia.id) throw new SeriesRequiredCoverException();

    const groups = await this._groupAppService.findAllByIds(groupIds);

    const seriesEntity = await this._seriesDomainService.create({
      data: { ...command.payload, groups },
    });

    await this._postDomainService.markSeen(seriesEntity, actor.id);
    seriesEntity.increaseTotalSeen();

    if (seriesEntity.isImportant()) {
      await this._postDomainService.markReadImportant(seriesEntity, actor.id);
      seriesEntity.setMarkReadImportant();
    }

    const result = await this._contentBinding.seriesBinding(seriesEntity, {
      actor,
      groups,
      authUser: actor,
    });

    this._sendEvent(seriesEntity, result);

    return result;
  }

  private _sendEvent(entity: SeriesEntity, result: SeriesDto): void {
    if (entity.isPublished()) {
      const payload: SeriesChangedMessagePayload = {
        state: 'publish',
        after: {
          id: entity.get('id'),
          actor: result.actor,
          setting: result.setting,
          type: entity.get('type'),
          groupIds: entity.get('groupIds'),
          communityIds: result.communities.map((community) => community.id),
          title: entity.get('title'),
          summary: entity.get('summary'),
          lang: entity.get('lang'),
          isHidden: entity.get('isHidden'),
          status: entity.get('status'),
          coverMedia: result.coverMedia,
          state: {
            attachGroupIds: entity.getState().attachGroupIds,
            detachGroupIds: entity.getState().detachGroupIds,
          },
          createdAt: entity.get('createdAt'),
          updatedAt: entity.get('updatedAt'),
          publishedAt: entity.get('publishedAt'),
        },
      };

      this._kafkaService.emit(KAFKA_TOPIC.CONTENT.SERIES_CHANGED, {
        key: entity.getId(),
        value: new SeriesChangedMessagePayload(payload),
      });
    }
  }
}
