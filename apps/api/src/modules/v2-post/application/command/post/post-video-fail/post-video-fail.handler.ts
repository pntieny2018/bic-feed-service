import { CONTENT_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { PostEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';

import { PostVideoFailCommand } from './post-video-fail.command';

@CommandHandler(PostVideoFailCommand)
export class PostVideoFailHandler implements ICommandHandler<PostVideoFailCommand, void> {
  public constructor(
    @Inject(POST_DOMAIN_SERVICE_TOKEN)
    private readonly _postDomainService: IPostDomainService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(command: PostVideoFailCommand): Promise<void> {
    const { videoId } = command.payload;

    const posts = (await this._contentRepository.findAll({
      where: {
        videoIdProcessing: videoId,
      },
      include: {
        shouldIncludeGroup: true,
        shouldIncludeSeries: true,
      },
    })) as PostEntity[];

    for (const post of posts) {
      const isScheduledPost =
        post.get('status') === CONTENT_STATUS.WAITING_SCHEDULE ||
        post.get('status') === CONTENT_STATUS.SCHEDULE_FAILED;

      const actor = await this._userAdapter.getUserByIdWithPermission(post.get('createdBy'));

      await this._postDomainService.update({
        actor,
        payload: {
          id: post.get('id'),
          media: {
            images: [],
            files: [],
            videos: [
              {
                id: videoId,
              },
            ],
          },
          status: isScheduledPost ? CONTENT_STATUS.SCHEDULE_FAILED : CONTENT_STATUS.DRAFT,
        },
        isVideoProcessFailed: true,
      });
    }
  }
}
