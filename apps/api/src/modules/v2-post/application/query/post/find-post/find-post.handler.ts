import { Inject } from '@nestjs/common';
import { EventBus, IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IPostDomainService,
  ISeriesDomainService,
  IReactionDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ContentHasSeenEvent } from '../../../../domain/event';
import { SeriesEntity } from '../../../../domain/model/content';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { PostDto } from '../../../dto';

import { FindPostQuery } from './find-post.query';

@QueryHandler(FindPostQuery)
export class FindPostHandler implements IQueryHandler<FindPostQuery, PostDto> {
  public constructor(
    private readonly _event: EventBus,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
    private readonly _reactionDomainService: IReactionDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private _seriesDomainService: ISeriesDomainService
  ) {}

  public async execute(query: FindPostQuery): Promise<PostDto> {
    const { postId, authUser } = query.payload;
    const postEntity = await this._postDomainService.getPostById(postId, authUser.id);

    const groups = await this._groupAdapter.getGroupsByIds(postEntity.get('groupIds'));
    if (authUser) {
      this._postValidator.checkCanReadContent(postEntity, authUser, groups);
    }

    const mentionUsers = await this._userAdapter.getUsersByIds(postEntity.get('mentionUserIds'));

    let series: SeriesEntity[];
    if (postEntity.get('seriesIds')?.length) {
      series = await this._seriesDomainService.findSeriesByIds(postEntity.get('seriesIds'));
    }

    const reactionsCount = await this._reactionDomainService.getAndCountReactionByContentIds([
      postEntity.getId(),
    ]);

    if (postEntity.isPublished()) {
      this._event.publish(new ContentHasSeenEvent({ contentId: postId, userId: authUser.id }));
    }

    return this._contentBinding.postBinding(postEntity, {
      groups,
      mentionUsers,
      series: series as SeriesEntity[],
      reactionsCount: reactionsCount.get(postEntity.getId()),
      authUser,
    });
  }
}
