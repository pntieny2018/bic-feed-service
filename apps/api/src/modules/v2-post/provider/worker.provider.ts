import { PublishContentToNewsfeedHandler } from '../application/command/worker/publish-post-to-newsfeed';
import { RemoveContentFromNewsfeedHandler } from '../application/command/worker/remove-post-from-newsfeed';
import { UserFollowGroupHandler } from '../application/command/worker/user-follow-group';
import { UserUnfollowGroupHandler } from '../application/command/worker/user-unfollow-group';

export const workerProvider = [
  PublishContentToNewsfeedHandler,
  RemoveContentFromNewsfeedHandler,
  UserFollowGroupHandler,
  UserUnfollowGroupHandler,
];
