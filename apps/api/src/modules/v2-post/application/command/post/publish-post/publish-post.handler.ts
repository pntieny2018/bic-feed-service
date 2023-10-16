import { CONTENT_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { ContentBinding } from '../../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../../binding/binding-post/content.interface';
import { PostDto } from '../../../dto';

import { PublishPostCommand } from './publish-post.command';

@CommandHandler(PublishPostCommand)
export class PublishPostHandler implements ICommandHandler<PublishPostCommand, PostDto> {
  public constructor(
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: ContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(command: PublishPostCommand): Promise<PostDto> {
    const { actor, ...payload } = command.payload;
    const postEntity = await this._postDomainService.publish({ payload, actor });

    if (postEntity.getSnapshot().status === CONTENT_STATUS.PUBLISHED) {
      return this._contentBinding.postBinding(postEntity, {
        actor,
        authUser: actor,
      });
    }

    const groups = await this._groupAdapter.getGroupsByIds(
      command.payload?.groupIds || postEntity.get('groupIds')
    );
    const mentionUsers = await this._userAdapter.getUsersByIds(payload.mentionUserIds || [], {
      withGroupJoined: true,
    });

    const result = await this._contentBinding.postBinding(postEntity, {
      groups,
      actor,
      authUser: actor,
      mentionUsers,
    });

    return result;
  }
}
