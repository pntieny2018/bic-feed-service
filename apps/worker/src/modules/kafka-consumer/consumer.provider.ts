import {
  FollowConsumer,
  GroupConsumer,
  MediaConsumer,
  PublishOrRemovePostToNewsfeedConsumer,
} from './consumers';

export const consumerProvider = [
  FollowConsumer,
  MediaConsumer,
  GroupConsumer,
  PublishOrRemovePostToNewsfeedConsumer,
];
