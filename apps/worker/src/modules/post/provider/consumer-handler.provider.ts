import { PublishContentToNewsfeedHandler } from '../application/command/publish-post-to-newsfeed';
import { RemoveContentFromNewsfeedHandler } from '../application/command/remove-post-from-newsfeed';
import { UserFollowGroupHandler } from '../application/command/user-follow-group';
import { UserUnfollowGroupHandler } from '../application/command/user-unfollow-group';

export const consumerHandlerProvider = [
  PublishContentToNewsfeedHandler,
  RemoveContentFromNewsfeedHandler,
  UserFollowGroupHandler,
  UserUnfollowGroupHandler,
];
