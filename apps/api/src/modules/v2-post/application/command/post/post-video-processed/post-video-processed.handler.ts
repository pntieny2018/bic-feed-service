import { MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  INewsfeedDomainService,
  IPostDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { PostEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';

import { PostVideoProcessedCommand } from './post-video-processed.command';

@CommandHandler(PostVideoProcessedCommand)
export class PostVideoProcessedHandler implements ICommandHandler<PostVideoProcessedCommand, void> {
  public constructor(
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomain: IPostDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomain: INewsfeedDomainService,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(command: PostVideoProcessedCommand): Promise<void> {
    const { videoId, status } = command.payload;
    const posts = (await this._contentRepo.findAll({
      where: {
        videoIdProcessing: videoId,
      },
    })) as PostEntity[];

    for (const post of posts) {
      const actor = await this._userAdapter.getUserByIdWithPermission(post.get('createdBy'));
      const props = {
        videoId,
        actor,
        id: post.get('id'),
      };

      switch (status) {
        case MEDIA_PROCESS_STATUS.COMPLETED:
          await this._postDomain.updatePostVideoSuccessProcessed(props);
          break;
        case MEDIA_PROCESS_STATUS.FAILED:
          await this._postDomain.updatePostVideoFailProcessed(props);
          break;
        default:
          break;
      }
    }
  }
}
