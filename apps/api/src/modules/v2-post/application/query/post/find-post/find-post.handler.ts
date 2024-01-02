import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';
import { IPostValidator, POST_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { PostDto } from '../../../dto';

import { FindPostQuery } from './find-post.query';

@QueryHandler(FindPostQuery)
export class FindPostHandler implements IQueryHandler<FindPostQuery, PostDto> {
  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(POST_VALIDATOR_TOKEN)
    private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService
  ) {}

  public async execute(query: FindPostQuery): Promise<PostDto> {
    const { postId, authUser } = query.payload;
    const postEntity = await this._postDomainService.getPostById(postId, authUser);

    await this._postValidator.checkCanReadContent(postEntity, authUser);

    const mentionUsers = await this._userAdapter.getUsersByIds(postEntity.get('mentionUserIds'));

    return this._contentBinding.postBinding(postEntity, {
      mentionUsers,
      authUser,
    });
  }
}
