import { PublishContentToNewsfeedHandler } from '../application/command/worker/publish-post-to-newsfeed';
import { RemoveContentFromNewsfeedHandler } from '../application/command/worker/remove-post-from-newsfeed';

export const workerProvider = [PublishContentToNewsfeedHandler, RemoveContentFromNewsfeedHandler];
