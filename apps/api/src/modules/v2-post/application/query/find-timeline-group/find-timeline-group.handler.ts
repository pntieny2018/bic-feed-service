import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { PostDto } from '../../dto';
import { FindTimelineGroupQuery } from './find-timeline-group.query';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import {
  IReactionQuery,
  REACTION_QUERY_TOKEN,
} from '../../../domain/query-interface/reaction.query.interface';
import { PostStatus } from '../../../data-type';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';

@QueryHandler(FindTimelineGroupQuery)
export class FindTimelineGroupHandler implements IQueryHandler<FindTimelineGroupQuery, PostDto[]> {
  @Inject(GROUP_APPLICATION_TOKEN) private readonly _groupAppService: IGroupApplicationService;
  @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService;
  @Inject(CONTENT_REPOSITORY_TOKEN) private readonly _contentRepository: IContentRepository;
  @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator;
  @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding;
  @Inject(REACTION_QUERY_TOKEN) private readonly _reactionQuery: IReactionQuery;
  @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService;

  public async execute(query: FindTimelineGroupQuery): Promise<any> {
    const ids = await this._getContentIds(query);
  }

  private async _getContentIds(query: FindTimelineGroupQuery): Promise<string[]> {
    const { groupId, isImportant, isMine, type, isSaved, limit, after, authUser } = query.payload;

    const posts = await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        isHidden: false,
        status: PostStatus.PUBLISHED,
        groupId,
        groupArchived: false,
        excludeReportedByUserId: authUser.id,
        isImportant,
        createdBy: isMine ? authUser.id : undefined,
        savedByUserId: isSaved ? authUser.id : undefined,
        type,
      },
      include: {
        shouldIncludeImportant: {
          userId: authUser.id,
        },
      },
      limit,
      order: {
        isImportantFirst: true,
      },
    });

    return posts.map((post) => post.getId());
  }
}
