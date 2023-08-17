export const ERRORS = {
  // API
  API_OK: 'api.ok',
  API_NOT_FOUND: 'api.not_found',
  API_VALIDATION_ERROR: 'api.validation_error',
  API_UNAUTHORIZED: 'api.unauthorized',
  API_FORBIDDEN: 'api.forbidden',
  API_SERVER_INTERNAL_ERROR: 'api.server_internal_error',

  // SYSTEM
  DATABASE_ERROR: 'database_error',
  DOMAIN_MODEL_VALIDATION: 'domain_model_validation',
  CURSOR_PARAMS_INVALID: 'cursor_params_invalid',

  // AUTH
  TOKEN_EXPIRED: 'app.auth_token.expired',

  // GROUP
  GROUP_NOT_EXISTING: 'group.not_existing',
  GROUP_NOT_MEMBER: 'group.not_member',

  // OPENAI
  OPENAI_EXCEPTION: 'quiz.openai_exception',

  // UPLOAD
  IMAGE_RESOURCE_INVALID: 'image_resource_invalid',

  // CONTENT
  CONTENT_NOT_FOUND: 'content.not_found',
  CONTENT_EMPTY_CONTENT: 'content.empty_content',
  CONTENT_EMPTY_GROUP: 'content.empty_group',
  CONTENT_GROUP_JOIN_REQUIRED: 'content.group_join_required',
  CONTENT_NO_BELONG_GROUP: 'content.audience_no_belong',
  CONTENT_NO_CRUD_PERMISSION: 'content.no_crud_permission',
  CONTENT_NO_CRUD_PERMISSION_AT_GROUP: 'content.no_crud_permission_at_group',
  CONTENT_NO_EDIT_SETTING_PERMISSION: 'content.no_edit_setting_permission',
  CONTENT_NO_EDIT_SETTING_PERMISSION_AT_GROUP: 'content.no_edit_setting_permission_at_group',
  CONTENT_NO_COMMENT_PERMISSION: 'content.no_comment_permission',
  CONTENT_NO_PIN_PERMISSION: 'content.no_pin_permission',
  CONTENT_ACCESS_DENIED: 'content.access_denied',
  CONTENT_PIN_NOT_FOUND: 'content.pin_not_found',
  CONTENT_PIN_LACK: 'content.pin_lack',
  CONTENT_NO_PUBLISH_YET: 'content.no_publish_yet',
  CONTENT_HAS_BEEN_PUBLISHED: 'content.has_been_published',
  CONTENT_QUIZ_EXISTED: 'content.quiz_existed',

  // ARTICLE
  ARTICLE_INVALID_PARAMETER: 'article.invalid_parameter',
  ARTICLE_PUBLISH_INVALID_TIME: 'article.publish_invalid_time',
  ARTICLE_REQUIRED_COVER: 'article.required_cover',
  ARTICLE_LIMIT_ATTACHED_SERIES: 'article.limit_attached_series',
  ARTICLE_INVALID_SCHEDULED_TIME: 'article.invalid_scheduled_time',

  // POST
  POST_INVALID_PARAMETER: 'post.invalid_parameter',
  POST_STATUS_CONFLICTED: 'post.status_conflicted',
  POST_LIMIT_ATTACHED_SERIES: 'post.limit_attached_series',

  // SERIES
  SERIES_NOT_FOUND: 'series.not_found',
  SERIES_REQUIRED_COVER: 'series.required_cover',

  // CATEGORY
  CATEGORY_INVALID: 'category_invalid',
  CATEGORY_NOT_ALLOW: 'category.not_allow',

  // COMMENT
  COMMENT_NOT_FOUND: 'comment.not_found',
  COMMENT_REPLY_NOT_EXISTING: 'comment.reply_not_existing',
  COMMENT_CAN_NOT_EMPTY: 'comment.can_not_empty',

  // QUIZ
  QUIZ_NOT_FOUND: 'quiz.not_found',
  QUIZ_OVER_TIME: 'quiz.over_time',
  QUIZ_GENERATE_FAIL: 'quiz.generate_fail',
  QUIZ_NO_CRUD_PERMISSION_AT_GROUP: 'quiz.no_crud_permission_at_group',
  QUIZ_PARTICIPANT_NOT_FOUND: 'quiz_participant.not_found',
  QUIZ_PARTICIPANT_NOT_FINISHED: 'quiz_participant.not_finished',
  QUIZ_QUESTION_LIMIT_EXCEEDED: 'quiz_question.limit_exceeded',
  QUIZ_QUESTION_NOT_FOUND: 'quiz_question.not_found',

  // REACTION
  REACTION_NOT_FOUND: 'reaction.not_found',
  REACTION_DUPLICATE: 'reaction.duplicate',
  REACTION_EXCEED_LIMIT: 'reaction.exceed_limit',
  REACTION_TARGET_NOT_EXISTING: 'reaction.target_not_existing',
  REACTION_NOT_HAVE_AUTHORITY: 'reaction.not_have_authority',

  // TAG
  TAG_NOT_FOUND: 'tag.not_found',
  TAG_IS_USED: 'tag.is_used',
  TAG_NAME_DUPLICATE: 'tag.name_duplicate',
  TAG_SERIES_INVALID: 'tag_series_invalid',
  TAG_NO_CREATE_PERMISSION: 'tag.no_create_permission',
  TAG_NO_UPDATE_PERMISSION: 'tag.no_update_permission',
  TAG_NO_DELETE_PERMISSION: 'tag.no_delete_permission',

  // RECENT SEARCH
  RECENT_SEARCH_NOT_FOUND: 'recent_search.not_found',
};
