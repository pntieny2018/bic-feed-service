import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { PostVideoSuccessEvent } from '../../../../domain/event';
import { PostEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';
import { MediaRequestDto } from '../../../dto';

import { PostVideoSuccessCommand } from './post-video-success.command';

@CommandHandler(PostVideoSuccessCommand)
export class PostVideoSuccessHandler implements ICommandHandler<PostVideoSuccessCommand, void> {
  public constructor(
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    private readonly event: EventBus
  ) {}

  public async execute(command: PostVideoSuccessCommand): Promise<void> {
    const { videoId } = command.payload;

    const posts = (await this._contentRepository.findAll({
      where: {
        videoIdProcessing: videoId,
      },
    })) as PostEntity[];

    for (const post of posts) {
      const media: MediaRequestDto = {
        images: [],
        files: [],
        videos: [
          {
            id: videoId,
          },
        ],
      };

      const isScheduledPost = post.isScheduleFailed() || post.isWaitingSchedule();

      const actor = await this._userAdapter.getUserByIdWithPermission(post.get('createdBy'));
      this.event.publish(new PostVideoSuccessEvent([videoId], actor.id));

      if (!isScheduledPost) {
        await this._postDomainService.publish({
          payload: {
            id: post.get('id'),
            media,
          },
          actor,
        });
      } else {
        await this._postDomainService.updateVideoProcess({
          id: post.get('id'),
          media,
          actor,
        });
      }
    }
  }
}
