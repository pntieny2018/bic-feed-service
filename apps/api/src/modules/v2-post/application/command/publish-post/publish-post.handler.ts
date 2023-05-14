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
import { PostEntity } from '../../../domain/model/post';
import { PostDto } from '../../dto';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';

@CommandHandler(PublishPostCommand)
export class PublishPostHandler implements ICommandHandler<PublishPostCommand, PostDto> {
  public constructor(
    @Inject(POST_REPOSITORY_TOKEN) private readonly _postRepository: IPostRepository,
    @Inject(POST_DOMAIN_SERVICE_TOKEN) private readonly _postDomainService: IPostDomainService,
    @Inject(GROUP_APPLICATION_TOKEN)
    private readonly _groupApplicationService: IGroupApplicationService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(POST_VALIDATOR_TOKEN) private readonly _postValidator: IPostValidator
  ) {}

  public async execute(command: PublishPostCommand): Promise<any> {
    const { id, groupIds, seriesIds, tagIds, setting, mentionUserIds } = command.payload;
    const postEntity = await this._postRepository.findOne({
      where: {
        id,
        groupArchived: true,
      },
      include: {
        mustIncludeGroup: true,
      },
    });

    if (!postEntity || !(postEntity instanceof PostEntity)) {
      throw new ContentNotFoundException();
    }

    const groups = await this._groupApplicationService.findAllByIds(groupIds);
    const mentionUsers = await this._userApplicationService.findAllByIds(mentionUserIds);

    //TODO: validate media
    await this._postValidator.validateSeriesAndTags(groupIds, seriesIds, tagIds);
    await this._postValidator.validateMentionUsers(mentionUsers, groupIds);

    const tagEntity = await this._postDomainService.publishPost({
      postEntity: postEntity as PostEntity,
      newData: command.payload,
      groups,
    });

    //TODO: emit event
    //TODO: bind data and return
  }
}
