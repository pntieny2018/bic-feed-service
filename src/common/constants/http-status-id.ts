export const HTTP_STATUS_ID = {
  API_OK: 'api.ok',
  API_VALIDATION_ERROR: 'api.validation_error',
  API_UNAUTHORIZED: 'api.unauthorized',
  API_FORBIDDEN: 'api.forbidden',
  API_SERVER_INTERNAL_ERROR: 'api.server_internal_error',

  // COMMENT
  API_COMMENT_GET_LIST_ERROR: 'api.comments.get_list.app_error',
  API_COMMENT_GET_ERROR: 'api.comments.get.app_error',
  API_COMMENT_CREATE_ERROR: 'api.comments.create.app_error',
  API_COMMENT_REPLY_ERROR: 'api.comments.reply.app_error',
  API_COMMENT_UPDATE_ERROR: 'api.comments.update.app_error',
  API_COMMENT_DELETE_ERROR: 'api.comments.delete.app_error',

  // POST
  API_POST_SEARCH_ERROR: 'api.posts.search.app_error',
  API_POST_GET_ERROR: 'api.posts.get.app_error',
  API_POST_GET_DRAFT_ERROR: 'api.posts.get_draft.app_error',
  API_POST_CREATE_ERROR: 'api.posts.create.app_error',
  API_POST_PUBLISH_ERROR: 'api.posts.publish.app_error',
  API_POST_UPDATE_ERROR: 'api.posts.update.app_error',
  API_POST_DELETE_ERROR: 'api.posts.delete.app_error',
  API_POST_MARK_READ_ERROR: 'api.posts.mark_as_read.app_error',

  //MEDIA
  API_MEDIA_CREATE_ERROR: 'api.media.create.app_error',
  API_MEDIA_DELETE_ERROR: 'api.media.delete.app_error',

  //REACTION
  API_REACTIONS_GET_LIST_ERROR: 'api.reactions.get_list.app_error',
  API_REACTIONS_CREATE_ERROR: 'api.reactions.create.app_error',
  API_REACTIONS_DELETE_ERROR: 'api.reactions.delete.app_error',

  //FEEDS
  API_FEEDS_GET_TIMELINE_ERROR: 'api.feeds.get_timeline.app_error',
  API_FEEDS_GET_NEWSFEED_ERROR: 'api.feeds.get_newsfeed.app_error',

  //Recent Searches
  API_RS_GET_LIST_ERROR: 'api.recent_searches.get_list.app_error',
  API_RS_CREATE_ERROR: 'api.recent_searches.create.app_error',
  API_RS_DELETE_ERROR: 'api.recent_searches.delete.app_error',
  API_RS_CLEAN_ERROR: 'api.recent_searches.clean.app_error',

  //FOLLOW
  API_FOLLOWS_GET_LIST_ERROR: 'api.follows.get_list.app_error',

  // INSIDE
  APP_POST_PUBLISH_CONTENT_EMPTY: 'app.post.publish.content_empty.app_error',
  APP_USER_EXISTING: 'app.user.existing.app_error',
  APP_COMMENT_EXISTING: 'app.comment.existing.app_error',
  APP_COMMENT_NOT_FOUND: 'app.comment.not_found.app_error',
  APP_COMMENT_REPLY_EXISTING: 'app.comment.reply.existing.app_error',
  APP_POST_SETTING_DISABLE: 'app.post.setting.disable.app_error',
  APP_POST_EXISTING: 'app.post.existing.app_error',
  APP_AUTH_TOKEN_EXPIRED: 'app.auth_token.expired',
  APP_POST_AS_READ_INVALID_PARAMETER: 'app.post.invalid_parameter',
  APP_POST_NOT_FOUND: 'app.post.not_found',
};
