import { CONTENT_STATUS } from '@beincom/constants';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../../../common/constants';
import {
  IPostDomainService,
  POST_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../../domain/infra-adapter-interface';
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
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async execute(command: PostVideoSuccessCommand): Promise<void> {
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
      const media: MediaRequestDto = {
        images: [],
        files: [],
        videos: [
          {
            id: videoId,
          },
        ],
      };

      const isScheduledPost =
        post.get('status') === CONTENT_STATUS.WAITING_SCHEDULE ||
        post.get('status') === CONTENT_STATUS.SCHEDULE_FAILED;

      const actor = await this._userAdapter.getUserByIdWithPermission(post.get('createdBy'));

      if (!isScheduledPost) {
        await this._postDomainService.publish({
          payload: {
            id: post.get('id'),
            media,
          },
          actor,
        });
      } else {
        await this._postDomainService.update({
          payload: {
            id: post.get('id'),
            media,
          },
          actor,
        });
      }
    }

    await this._emitToUploadService(videoId, posts[0]?.get('createdBy') || null);
  }

  private async _emitToUploadService(videoId: string, userId: string): Promise<void> {
    await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_VIDEO_HAS_BEEN_USED, {
      key: null,
      value: JSON.stringify({ videoIds: [videoId], userId }),
    });
  }
}
