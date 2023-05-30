import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { PostDto } from '../../dto';
import { FindPostQuery } from './find-post.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { ContentNotFoundException } from '../../../domain/exception';
import { PostEntity } from '../../../domain/model/content';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { AccessDeniedException } from '../../../domain/exception/access-denied.exception';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { SeriesEntity } from '../../../domain/model/content/series.entity';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';

@QueryHandler(FindPostQuery)
export class FindPostHandler implements IQueryHandler<FindPostQuery, PostDto> {
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepo: IContentRepository;
  @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator;
  @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding;
  @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery;

  public async execute(query: FindPostQuery): Promise<any> {
    const { postId, authUser } = query.payload;
    const postEntity = await this._contentRepo.findOne({
      where: {
        id: postId,
        groupArchived: false,
        excludeReportedByUserId: authUser.id,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeTag: true,
        shouldIncludeLinkPreview: true,
        shouldIncludeSavedUserId: authUser?.id,
        shouldIncludeMarkReadImportantUserId: authUser?.id,
        shouldIncludeReactionUserId: authUser?.id,
      },
    });

    if (
      (postEntity.isDraft() && !postEntity.isOwner(authUser.id)) ||
      postEntity.isHidden() ||
      !postEntity ||
      !(postEntity instanceof PostEntity)
    ) {
      throw new ContentNotFoundException();
    }

    if (!authUser && !postEntity.isOpen()) {
      throw new AccessDeniedException();
    }
    const groups = await this._groupAppService.findAllByIds(postEntity.get('groupIds'));
    if (authUser) {
      await this._postValidator.checkCanReadContent(postEntity, authUser, groups);
    }

    const mentionUsers = await this._userAppService.findAllByIds(postEntity.get('mentionUserIds'));

    let series;
    if (postEntity.get('seriesIds')?.length) {
      series = await this._contentRepo.findAll({
        attributes: ['id', 'title'],
        where: {
          groupArchived: false,
          ids: postEntity.get('seriesIds'),
        },
        include: {
          mustIncludeGroup: true,
        },
      });
    }

    const reactionsCount = await this._reactionQuery.getAndCountReactionByContents([
      series.getId(),
    ]);

    return this._contentBinding.postBinding(postEntity, {
      groups,
      actor: new UserDto(authUser),
      mentionUsers,
      series: series as SeriesEntity[],
    });
  }
}
