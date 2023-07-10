export const ERRORS = {
  TAG: {
    TAG_NAME_EXCEED_MAX_LENGTH: 'tag.tag_name_exceed_max_length',
    TAG_DUPLICATE_NAME: 'tag.duplicate_name',
    TAG_NOT_FOUND: 'tag.not_found',
    TAG_IS_USED: 'tag.is_used',
    TAG_NO_UPDATE_PERMISSION: 'tag.no_update_permission',
    TAG_NO_CREATE_PERMISSION: 'tag.no_create_permission',
    TAG_NO_DELETE_PERMISSION: 'tag.no_delete_permission',
  },
  CONTENT: {
    HAS_QUIZ: 'content.has_quiz',
    EMPTY: 'content.empty',
    EMPTY_GROUP: 'content.empty_group',
    AUDIENCE_NO_BELONG: 'content.audience_no_belong',
    CONTENT_NOT_FOUND: 'content.not_found',
    CONTENT_NO_PIN_PERMISSION: 'content.no_pin_permission',
    CONTENT_PIN_NOT_FOUND: 'content.pin_not_found',
    CONTENT_PIN_LACK: 'content.pin_lack',
    CONTENT_GROUP_JOIN_REQUIRED: 'content.group_join_required',
    CONTENT_NO_CRUD_PERMISSION: 'content.no_crud_permission',
    CONTENT_NO_EDIT_SETTING_PERMISSION: 'content.no_edit_setting_permission',
    CONTENT_ACCESS_DENIED: 'content.access_denied',
    CONTENT_NO_COMMENT_PERMISSION: 'content.no_comment_permission',
    CONTENT_NO_CRUD_PERMISSION_AT_GROUP: 'content.no_crud_permission_at_group',
    CONTENT_NO_EDIT_SETTING_PERMISSION_AT_GROUP: 'content.no_edit_setting_permission_at_group',
  },
  QUIZ: {
    QUIZ_NOT_FOUND: 'quiz.not_found',
    QUIZ_NO_CRUD_PERMISSION_AT_GROUP: 'quiz.no_crud_permission_at_group',
    OPENAI_EXCEPTION: 'quiz.openai_exception',
    GENERATE_FAIL: 'quiz.generate_fail',
  },
  USER: {
    USER_NO_BELONG_GROUP: 'user.no_belong_group',
  },
  ARTICLE: {
    ARTICLE_NOT_FOUND: 'article.not_found',
    ARTICLE_NO_UPDATE_PERMISSION: 'article.no_update_permission',
    ARTICLE_NO_CREATE_PERMISSION: 'article.no_create_permission',
    ARTICLE_NO_DELETE_PERMISSION: 'article.no_delete_permission',
    ARTICLE_NO_READ_PERMISSION: 'article.no_read_permission',
  },
  POST: {
    POST_NOT_FOUND: 'post.not_found',
    POST_NO_UPDATE_PERMISSION: 'post.no_update_permission',
    POST_NO_CREATE_PERMISSION: 'post.no_create_permission',
    POST_NO_DELETE_PERMISSION: 'post.no_delete_permission',
    POST_NO_READ_PERMISSION: 'post.no_read_permission',
  },
  SERIES: {
    SERIES_NOT_FOUND: 'post.not_found',
    SERIES_NO_UPDATE_PERMISSION: 'series.no_update_permission',
    SERIES_NO_CREATE_PERMISSION: 'series.no_create_permission',
    SERIES_NO_READ_PERMISSION: 'series.no_read_permission',
    SERIRES_REQUIRED_COVER: 'series.required_cover',
  },
  MENTION: {
    USER_NOT_FOUND: 'mention.user_not_found',
  },
  COMMENT: {
    COMMENT_NOT_FOUND: 'comment.not_found',
    REPLY_NOT_EXIST: 'comment.reply_not_exist',
    CAN_NOT_EMPTY: 'comment.can_not_empty',
  },
  RECENT_SEARCH: {
    RECENT_SEARCH_NOT_FOUND: 'recent_search.not_found',
  },
  REACTION: {
    REACTION_DUPLICATE: 'reaction.duplicate',
    REACTION_NOT_FOUND: 'reaction.not_found',
    REACTION_NOT_HAVE_AUTHORITY: 'reaction.not_have_authority',
  },
  IMAGE_RESOURCE_INVALID: 'image_resource_invalid',
  TAG_SERIES_INVALID: 'tag_series_invalid',

  API_OK: 'api.ok',
  API_VALIDATION_ERROR: 'api.validation_error',
  API_UNAUTHORIZED: 'api.unauthorized',
  API_FORBIDDEN: 'api.forbidden',
  API_SERVER_INTERNAL_ERROR: 'api.server_internal_error',
  DATABASE_ERROR: 'database_error',
  DOMAIN_MODEL_VALIDATION: 'domain_model_validation',
  INTERNAL_SERVER_ERROR: 'api.internal_server_error',
  CURSOR_PARAMS_INVALID: 'cursor_params_invalid',
};
