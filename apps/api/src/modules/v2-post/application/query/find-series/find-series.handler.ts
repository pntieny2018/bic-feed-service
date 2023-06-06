import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { SeriesDto } from '../../dto';
import { FindSeriesQuery } from './find-series.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { ContentNotFoundException } from '../../../domain/exception';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { AccessDeniedException } from '../../../domain/exception/access-denied.exception';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { SeriesEntity } from '../../../domain/model/content';

@QueryHandler(FindSeriesQuery)
export class FindSeriesHandler implements IQueryHandler<FindSeriesQuery, SeriesDto> {
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepo: IContentRepository;
  @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator;
  @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding;
  @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery;

  public async execute(query: FindSeriesQuery): Promise<SeriesDto> {
    const { seriesId, authUser } = query.payload;
    const seriesEntity = await this._contentRepo.findOne({
      where: {
        id: seriesId,
        groupArchived: false,
        excludeReportedByUserId: authUser.id,
      },
      include: {
        shouldIncludeGroup: true,
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
      throw new AccessDeniedException();
    }
    const groups = await this._groupAppService.findAllByIds(seriesEntity.get('groupIds'));
    if (authUser) {
      await this._postValidator.checkCanReadContent(seriesEntity, authUser, groups);
    }

    return this._contentBinding.seriesBinding(seriesEntity, {
      groups,
      authUser,
    });
  }
}
