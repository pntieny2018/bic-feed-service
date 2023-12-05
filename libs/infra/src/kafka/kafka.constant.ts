export const KAFKA_TOKEN = `KAFKA_TOKEN`;
export const KAFKA_PRODUCER = `stream_producer`;
export const KAFKA_TOPIC = {
  BEIN_GROUP: {
    USERS_FOLLOW_GROUPS: `bein_group.users_follow_groups`,
    USERS_UNFOLLOW_GROUP: `bein_group.users_unfollow_group`,
    UPDATED_PRIVACY_GROUP: `bein_group.group_privacy_has_been_updated`,
    GROUP_STATE_HAS_BEEN_CHANGED: `bein_group.group_state_has_been_changed`,
  },
  BEIN_UPLOAD: {
    VIDEO_HAS_BEEN_PROCESSED: `bein_upload.video_processing_end`,
    JOB: {
      MARK_VIDEO_HAS_BEEN_USED: `bein_upload.job.mark_videos_has_been_used`,
      DELETE_VIDEOS: `bein_upload.job.delete_videos`,
      MARK_FILE_HAS_BEEN_USED: `bein_upload.job.mark_files_has_been_used`,
      DELETE_FILES: `bein_upload.job.delete_files`,
    },
  },
  BEIN_NOTIFICATION: {
    WS_EVENT: `ws-event`,
  },
  STREAM: {
    VIDEO_POST_PUBLIC: `bein_stream.video_post_has_been_created`,
    POST: `bein_stream.post`,
    COMMENT: `bein_stream.comment`,
    REACTION: `bein_stream.reaction`,
    REPORT: `bein_stream.report`,
  },
  CONTENT: {
    QUIZ_PROCESSED: `content_service.quiz_processed`,
    POST_AUTO_SAVE: `content_service.post_auto_save`,
    COMMENT_CHANGED: `content_service.comment_changed`,
    SERIES_DELETED: `content_service.series_deleted`,
    PUBLISH_OR_REMOVE_TO_NEWSFEED: `content_service.publish_or_remove_to_newsfeed`,
  },
};
