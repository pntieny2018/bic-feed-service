import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { UpdateSeriesCommand } from './update-series.command';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  ContentEmptyGroupException,
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
  SeriesRequiredCoverException,
} from '../../../domain/exception';
import {
  ISeriesDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { SeriesEntity } from '../../../domain/model/content';

@CommandHandler(UpdateSeriesCommand)
export class UpdateSeriesHandler implements ICommandHandler<UpdateSeriesCommand, void> {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupAppService: IGroupApplicationService,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomainService: ISeriesDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private readonly _eventEmitter: InternalEventEmitterService
  ) {}

  public async execute(command: UpdateSeriesCommand): Promise<void> {
    const { actor, id, groupIds, coverMedia } = command.payload;

    const seriesEntity = await this._contentRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
      },
    });

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }

    if (!seriesEntity.isOwner(actor.id)) throw new ContentNoCRUDPermissionException();

    if (coverMedia && !coverMedia.id) throw new SeriesRequiredCoverException();

    if (groupIds && groupIds.length === 0) throw new ContentEmptyGroupException();

    const groupIdsNeedFind = seriesEntity.get('groupIds');
    groupIdsNeedFind.push(...(groupIds || []));
    const groups = await this._groupAppService.findAllByIds([...new Set(groupIdsNeedFind)]);

    await this._seriesDomainService.update({
      seriesEntity,
      groups,
      newData: command.payload,
    });
  }
}
