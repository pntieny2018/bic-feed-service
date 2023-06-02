import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { UpdateSeriesCommand } from './update-series.command';
import {
  GROUP_APPLICATION_TOKEN,
  GroupDto,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import {
  ContentEmptyGroupException,
  ContentNoCRUDPermissionException,
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
    private readonly _eventEmitter: InternalEventEmitterService
  ) {}

  public async execute(command: UpdateSeriesCommand): Promise<SeriesDto> {
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

    const isImportantBefore = seriesEntity.isImportant();

    if (!seriesEntity || !(seriesEntity instanceof SeriesEntity)) {
      throw new ContentNotFoundException();
    }

    if (!seriesEntity.isOwner(actor.id)) throw new ContentNoCRUDPermissionException();

    if (coverMedia && !coverMedia.id) throw new SeriesRequiredCoverException();

    if (groupIds && groupIds.length === 0) throw new ContentEmptyGroupException();

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

    return this._contentBinding.seriesBinding(seriesEntity, {
      actor,
      groups,
    });
  }
}
