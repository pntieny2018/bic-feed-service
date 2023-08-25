import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  ContentAccessDeniedException,
  ContentNotFoundException,
} from '../../../../domain/exception';
import { SeriesEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../../domain/service-adapter-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { SeriesDto } from '../../../dto';

import { FindSeriesQuery } from './find-series.query';

@QueryHandler(FindSeriesQuery)
export class FindSeriesHandler implements IQueryHandler<FindSeriesQuery, SeriesDto> {
  public constructor(
    @Inject(GROUP_ADAPTER) private readonly _groupAdapter: IGroupAdapter,
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepo: IContentRepository,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding
  ) {}

  public async execute(query: FindSeriesQuery): Promise<SeriesDto> {
    const { seriesId, authUser } = query.payload;
    const seriesEntity = await this._contentRepo.findOne({
      where: {
        id: seriesId,
        groupArchived: false,
        excludeReportedByUserId: authUser.id,
      },
      include: {
        mustIncludeGroup: true,
        shouldIncludeItems: true,
        shouldIncludeCategory: true,
        shouldIncludeSaved: {
          userId: authUser?.id,
        },
        shouldIncludeMarkReadImportant: {
          userId: authUser?.id,
        },
      },
    });

    if (
      !seriesEntity ||
      !(seriesEntity instanceof SeriesEntity) ||
      (seriesEntity.isDraft() && !seriesEntity.isOwner(authUser.id)) ||
      seriesEntity.isHidden()
    ) {
      throw new ContentNotFoundException();
    }

    if (!authUser && !seriesEntity.isOpen()) {
      throw new ContentAccessDeniedException();
    }
    const groups = await this._groupAdapter.getGroupByIds(seriesEntity.get('groupIds'));
    if (authUser) {
      this._postValidator.checkCanReadContent(seriesEntity, authUser, groups);
    }

    return this._contentBinding.seriesBinding(seriesEntity, {
      groups,
      authUser,
    });
  }
}
