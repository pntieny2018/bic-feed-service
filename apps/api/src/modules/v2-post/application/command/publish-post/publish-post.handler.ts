import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { PublishPostCommand } from './publish-post.command';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post.repository.interface';
import {
  IContentValidator,
  CONTENT_VALIDATOR_TOKEN,
  IPostValidator,
  POST_VALIDATOR_TOKEN,
} from '../../../domain/validator/interface';
import {
  GROUP_APPLICATION_TOKEN,
  IGroupApplicationService,
} from '../../../../v2-group/application';
import { ContentNotFoundException } from '../../../domain/exception';
import { PostEntity } from '../../../domain/model/content';
import { PostDto } from '../../dto';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { ContentBinding } from '../../binding/binding-post/content.binding';
import { CONTENT_BINDING_TOKEN } from '../../binding/binding-post/content.interface';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../../../../../common/constants';
import { ClientKafka } from '@nestjs/microservices';

@CommandHandler(PublishPostCommand)
export class PublishPostHandler implements ICommandHandler<PublishPostCommand, PostDto> {
  public constructor(
    @Inject(POST_REPOSITORY_TOKEN) private readonly _postRepository: IPostRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator,
    @Inject(CONTENT_BINDING_TOKEN) private readonly _contentBinding: ContentBinding,
    @Inject(KAFKA_PRODUCER)
    private readonly _clientKafka: ClientKafka
  ) {}

  public async execute(command: PublishPostCommand): Promise<PostDto> {
    const { authUser, id, groupIds, mentionUserIds } = command.payload;
    const postEntity = await this._postRepository.findOne({
      where: {
        id,
        groupArchived: false,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
        shouldIncludeTag: true,
        shouldIncludeLinkPreview: true,
      },
    });
    if (!postEntity || !(postEntity instanceof PostEntity)) {
      throw new ContentNotFoundException();
    }

    const groups = await this._groupApplicationService.findAllByIds(
      groupIds || postEntity.get('groupIds')
    );
    const mentionUsers = await this._userApplicationService.findAllByIds(mentionUserIds, {
      withGroupJoined: true,
    });

    const post = await this._postDomainService.publishPost({
      postEntity: postEntity as PostEntity,
      newData: {
        ...command.payload,
        mentionUsers,
        groups,
      },
    });
    return this._contentBinding.postBinding(post, {
      groups,
      // actor: authUser,
      mentionUsers,
    });
  }
}
