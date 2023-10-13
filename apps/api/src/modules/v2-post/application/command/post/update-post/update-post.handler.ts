import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../../domain/infra-adapter-interface';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  IUserAdapter,
  USER_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';
import { PostDto } from '../../../dto';

import { UpdatePostCommand } from './update-post.command';

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand, PostDto> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async execute(command: UpdatePostCommand): Promise<PostDto> {
    const { authUser, ...payload } = command.payload;
    const postEntity = await this._postDomainService.update({ actor: authUser, payload });

    if (postEntity.isImportant()) {
      await this._contentDomainService.markReadImportant(
        postEntity.get('id'),
        command.payload.authUser.id
      );
      postEntity.setMarkReadImportant();
    }

    const groups = await this._groupAdapter.getGroupsByIds(
      command.payload?.groupIds || postEntity.get('groupIds')
    );
    const mentionUsers = await this._userAdapter.getUsersByIds(command.payload.mentionUserIds, {
      withGroupJoined: true,
    });

    const result = await this._contentBinding.postBinding(postEntity, {
      groups,
      actor: command.payload.authUser,
      authUser: command.payload.authUser,
      mentionUsers,
    });

    return result;
  }
}
