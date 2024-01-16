import { AttachDetachContentNewsfeedHandler } from '../application/command/attach-detach-content-newsfeed';
import { DispatchFollowUnfollowGroupsHandler } from '../application/command/dispatch-follow-unfollow-groups';
import { ProducerAttachDetachNewsfeedHandler } from '../application/command/producer-attach-detach-newsfeed';
import { ProducerFollowUnfollowGroupsHandler } from '../application/command/producer-follow-unfollow-groups';
import { PublishContentToNewsfeedHandler } from '../application/command/publish-post-to-newsfeed';
import { RemoveContentFromNewsfeedHandler } from '../application/command/remove-post-from-newsfeed';
import { UserFollowGroupHandler } from '../application/command/user-follow-group';
import { UserUnfollowGroupHandler } from '../application/command/user-unfollow-group';
import { ContentCron } from '../application/cron/content.cron';
import { PostCronService } from '../application/cron/post.cron';
import { ContentDomainService } from '../domain/domain-service';
import { CONTENT_DOMAIN_SERVICE_TOKEN } from '../domain/domain-service/interface';
import {
  CACHE_CONTENT_REPOSITORY_TOKEN,
  CONTENT_REPOSITORY_TOKEN,
} from '../domain/repositoty-interface';
import { CacheContentRepository, ContentRepository } from '../driven-adapter/repository';

export const postProvider = [
  /** Application Cron Handler */
  ContentCron,
  PostCronService,

  {
    provide: CONTENT_DOMAIN_SERVICE_TOKEN,
    useClass: ContentDomainService,
  },
  {
    provide: CONTENT_REPOSITORY_TOKEN,
    useClass: ContentRepository,
  },
  {
    provide: CACHE_CONTENT_REPOSITORY_TOKEN,
    useClass: CacheContentRepository,
  },
  /** Application Handler */
  PublishContentToNewsfeedHandler,
  RemoveContentFromNewsfeedHandler,
  UserFollowGroupHandler,
  UserUnfollowGroupHandler,
  ProducerAttachDetachNewsfeedHandler,
  AttachDetachContentNewsfeedHandler,

  ProducerFollowUnfollowGroupsHandler,
  DispatchFollowUnfollowGroupsHandler,
];
