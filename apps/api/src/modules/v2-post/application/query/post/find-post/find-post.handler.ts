import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  IPostDomainService,
  ISeriesDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
  SERIES_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  IReactionDomainService,
  REACTION_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface/reaction.domain-service.interface';
import { SeriesEntity } from '../../../../domain/model/content';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
} from '../../../../domain/service-adapter-interface /group-adapter.interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { PostDto } from '../../../dto';

import { FindPostQuery } from './find-post.query';

@QueryHandler(FindPostQuery)
export class FindPostHandler implements IQueryHandler<FindPostQuery, PostDto> {
  public constructor(
    @Inject(GROUP_ADAPTER) private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_APPLICATION_TOKEN) private readonly _userAppService: IUserApplicationService,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(REACTION_DOMAIN_SERVICE_TOKEN)
    private readonly _reactionDomainService: IReactionDomainService,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private _postDomainService: IPostDomainService,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN) private _seriesDomainService: ISeriesDomainService
  ) {}

  public async execute(query: FindPostQuery): Promise<PostDto> {
    const { postId, authUser } = query.payload;
    const postEntity = await this._postDomainService.getPostById(postId, authUser.id);

    const groups = await this._groupAdapter.getGroupByIds(postEntity.get('groupIds'));
    if (authUser) {
      this._postValidator.checkCanReadContent(postEntity, authUser, groups);
    }

    const mentionUsers = await this._userAppService.findAllByIds(postEntity.get('mentionUserIds'));

    let series: SeriesEntity[];
    if (postEntity.get('seriesIds')?.length) {
      series = await this._seriesDomainService.findSeriesByIds(postEntity.get('seriesIds'));
    }

    const reactionsCount = await this._reactionDomainService.getAndCountReactionByContentIds([
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
