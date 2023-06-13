export const KAFKA_PRODUCER = `${process.env.KAFKA_ENV}.stream_producer`;
export const KAFKA_TOPIC = {
  BEIN_GROUP: {
    USERS_FOLLOW_GROUPS: `${process.env.KAFKA_ENV}.bein_group.users_follow_groups`,
    USERS_UNFOLLOW_GROUP: `${process.env.KAFKA_ENV}.bein_group.users_unfollow_group`,
    UPDATED_PRIVACY_GROUP: `${process.env.KAFKA_ENV}.bein_group.group_privacy_has_been_updated`,
    GROUP_STATE_HAS_BEEN_CHANGED: `${process.env.KAFKA_ENV}.bein_group.group_state_has_been_changed`,
  },
  BEIN_UPLOAD: {
    VIDEO_HAS_BEEN_PROCESSED: `${process.env.KAFKA_ENV}.bein_upload.video_processing_end`,
    JOB: {
      MARK_VIDEO_HAS_BEEN_USED: `${process.env.KAFKA_ENV}.bein_upload.job.mark_videos_has_been_used`,
      DELETE_VIDEOS: `${process.env.KAFKA_ENV}.bein_upload.job.delete_videos`,
      MARK_FILE_HAS_BEEN_USED: `${process.env.KAFKA_ENV}.bein_upload.job.mark_files_has_been_used`,
      DELETE_FILES: `${process.env.KAFKA_ENV}.bein_upload.job.delete_files`,
    },
  },
  STREAM: {
    VIDEO_POST_PUBLIC: `${process.env.KAFKA_ENV}.bein_stream.video_post_has_been_created`,
    POST: `${process.env.KAFKA_ENV}.bein_stream.post`,
    COMMENT: `${process.env.KAFKA_ENV}.bein_stream.comment`,
    REACTION: `${process.env.KAFKA_ENV}.bein_stream.reaction`,
    REPORT: `${process.env.KAFKA_ENV}.bein_stream.report`,
  },
  CONTENT: {
    POST_CHANGED: `${process.env.KAFKA_ENV}.content_service.post_changed`,
    POST_AUTO_SAVE: `${process.env.KAFKA_ENV}.content_service.post_auto_save`,
    ARTICLE_CHANGED: `${process.env.KAFKA_ENV}.content_service.article_changed`,
    SERIES_CHANGED: `${process.env.KAFKA_ENV}.content_service.series_changed`,
    COMMENT_CHANGED: `${process.env.KAFKA_ENV}.content_service.comment_changed`,
    SERIES_DELETED: `${process.env.KAFKA_ENV}.content_service.series_deleted`,
  },
};
