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
    AUDIENCE_NO_BELONG: 'content.audience_no_belong',
    CONTENT_NOT_FOUND: 'content.not_found',
    CONTENT_NO_PIN_PERMISSION: 'content.no_pin_permission',
    CONTENT_PIN_NOT_FOUND: 'content.pin_not_found',
    CONTENT_PIN_LACK: 'content.pin_lack',
    CONTENT_REQUIRE_GROUP: 'content.require_group',
  },
  ARTICLE: {
    ARTICLE_NO_READ_PERMISSION: 'article.no_read_permission',
  },
  POST: {
    POST_NO_READ_PERMISSION: 'post.no_read_permission',
  },
  SERIES: {
    SERIES_NO_READ_PERMISSION: 'series.no_read_permission',
  },
  API_OK: 'api.ok',
  API_VALIDATION_ERROR: 'api.validation_error',
  API_UNAUTHORIZED: 'api.unauthorized',
  API_FORBIDDEN: 'api.forbidden',
  API_SERVER_INTERNAL_ERROR: 'api.server_internal_error',
  DATABASE_ERROR: 'database_error',
  DOMAIN_MODEL_VALIDATION: 'domain_model_validation',
  INTERNAL_SERVER_ERROR: 'api.internal_server_error',
};
