import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { CreateSeriesCommand } from './create-series.command';
import { CreateSeriesDto } from './create-series.dto';
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
    private readonly _eventEmitter: InternalEventEmitterService
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

    return this._contentBinding.seriesBinding(seriesEntity, {
      actor,
      groups,
    });
  }
}
