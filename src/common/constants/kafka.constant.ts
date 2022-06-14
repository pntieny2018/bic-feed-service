export const KAFKA_PRODUCER = `${process.env.KAFKA_ENV}.stream_producer`;
export const KAFKA_TOPIC = {
  BEIN_GROUP: {
    USERS_FOLLOW_GROUPS: `${process.env.KAFKA_ENV}.bein_group.users_follow_groups`,
    USERS_UNFOLLOW_GROUP: `${process.env.KAFKA_ENV}.bein_group.users_unfollow_group`,
    UPDATED_PRIVACY_GROUP: `${process.env.KAFKA_ENV}.bein_group.group_privacy_has_been_updated`,
  },
  BEIN_UPLOAD: {
    VIDEO_HAS_BEEN_PROCESSED: `${process.env.KAFKA_ENV}.bein_upload.video_processing_end`,
  },
  STREAM: {
    VIDEO_POST_PUBLIC: `${process.env.KAFKA_ENV}.bein_stream.video_post_has_been_created`,
    POST: `${process.env.KAFKA_ENV}.bein_stream.post`,
    COMMENT: `${process.env.KAFKA_ENV}.bein_stream.comment`,
    REACTION: `${process.env.KAFKA_ENV}.bein_stream.reaction`,
  },
};
