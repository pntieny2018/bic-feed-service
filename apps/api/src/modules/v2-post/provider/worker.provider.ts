import { PublishContentToNewsfeedHandler } from '../application/command/worker/publish-post-to-newsfeed';
import { RemoveContentToNewsfeedHandler } from '../application/command/worker/remove-post-to-newsfeed';

export const workerProvider = [PublishContentToNewsfeedHandler, RemoveContentToNewsfeedHandler];
