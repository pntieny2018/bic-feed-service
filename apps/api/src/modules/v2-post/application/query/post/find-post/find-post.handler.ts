import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../../v2-group/application';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  ContentNotFoundException,
  ContentAccessDeniedException,
} from '../../../../domain/exception';
import { PostEntity, SeriesEntity } from '../../../../domain/model/content';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../../domain/query-interface/reaction.query.interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { PostDto } from '../../../dto';

import { FindPostQuery } from './find-post.query';

@QueryHandler(FindPostQuery)
export class FindPostHandler implements IQueryHandler<FindPostQuery, PostDto> {
  public constructor(
    @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService,
    @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepo: IContentRepository,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery
  ) {}

  public async execute(query: FindPostQuery): Promise<PostDto> {
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
        shouldIncludeLinkPreview: true,
        shouldIncludeQuiz: true,
        shouldIncludeSaved: {
          userId: authUser?.id,
        },
        shouldIncludeMarkReadImportant: {
          userId: authUser?.id,
        },
        shouldIncludeReaction: {
          userId: authUser?.id,
        },
      },
    });

    if (
      !postEntity ||
      !(postEntity instanceof PostEntity) ||
      (postEntity.isDraft() && !postEntity.isOwner(authUser.id)) ||
      (postEntity.isHidden() && !postEntity.isOwner(authUser.id)) ||
      postEntity.isInArchivedGroups()
    ) {
      throw new ContentNotFoundException();
    }

    if (!authUser && !postEntity.isOpen()) {
      throw new ContentAccessDeniedException();
    }
    const groups = await this._groupAppService.findAllByIds(postEntity.get('groupIds'));
    if (authUser) {
      await this._postValidator.checkCanReadContent(postEntity, authUser, groups);
    }

    const mentionUsers = await this._userAppService.findAllByIds(postEntity.get('mentionUserIds'));

    let series;
    if (postEntity.get('seriesIds')?.length) {
      series = await this._contentRepo.findAll({
        attributes: {
          exclude: ['content'],
        },
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
      postEntity.getId(),
    ]);
    return this._contentBinding.postBinding(postEntity, {
      groups,
      mentionUsers,
      series: series as SeriesEntity[],
      reactionsCount: reactionsCount.get(postEntity.getId()),
      authUser,
    });
  }
}
