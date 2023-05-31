import { HTTP_STATUS_ID } from './http-status-id';

export const HTTP_MESSAGES = {
  [HTTP_STATUS_ID.API_UNAUTHORIZED]: 'You must be logged in to perform this action !',
  [HTTP_STATUS_ID.APP_AUTH_TOKEN_EXPIRED]: 'Auth token expired',
  [HTTP_STATUS_ID.API_FORBIDDEN]: 'Unable to perform this action',
  [HTTP_STATUS_ID.APP_POST_SETTING_DISABLE]:
    'You cannot perform this action because post setting is disable',
  [HTTP_STATUS_ID.APP_COMMENT_NOT_EXISTING]: 'Comment not found',
  [HTTP_STATUS_ID.APP_COMMENT_REPLY_NOT_EXISTING]: 'Failed to reply: Comment not found',
  [HTTP_STATUS_ID.APP_COMMENT_POST_NOT_EXISTING]: 'Post not found',
  [HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY]: 'Content or media of post is empty',
  [HTTP_STATUS_ID.APP_POST_NOT_EXISTING]: 'Post not found',
  [HTTP_STATUS_ID.APP_REACTION_NOT_EXISTING]: 'Unable to find the reaction',
  [HTTP_STATUS_ID.APP_REACTION_RATE_LIMIT_KIND]: 'Exceed reaction kind limit',
  [HTTP_STATUS_ID.APP_REACTION_TARGET_EXISTING]: 'Unable to find the reaction target',
  [HTTP_STATUS_ID.APP_USER_NOT_EXISTING]: 'Unable to find the user',
  [HTTP_STATUS_ID.APP_REACTION_UNIQUE]: 'Duplicate reaction kind',
  [HTTP_STATUS_ID.APP_SERIES_NOT_EXISTING]: 'Unable to find the series',
  [HTTP_STATUS_ID.APP_NOT_OWNER]: 'You are not owner',
  [HTTP_STATUS_ID.API_POST_USER_IS_NOT_MEMBER_OF_GROUP]: 'You are not a member of group',
  [HTTP_STATUS_ID.APP_TAG_NAME_EXISTING]: 'Name is existed',
  [HTTP_STATUS_ID.APP_TAG_EXISTING]: 'Tag is existed',
  [HTTP_STATUS_ID.APP_TAG_NOT_EXISTING]: 'Tag is not existed',
  [HTTP_STATUS_ID.APP_TAG_POST_ATTACH]: 'Tag is used',
  [HTTP_STATUS_ID.APP_GROUP_NOT_EXIST]: 'Group id is not existed',
  [HTTP_STATUS_ID.APP_ARTICLE_INVALID_PUBLISHED_AT]: 'Fail schedule',
  [HTTP_STATUS_ID.APP_TAG_NOT_HAVE_CREATE_PERMISSION]:
    "Failed to create tag: you don't have permission.",
  [HTTP_STATUS_ID.APP_TAG_NOT_HAVE_UPDATE_PERMISSION]:
    "Failed to update tag: you don't have permission.",
  [HTTP_STATUS_ID.APP_TAG_NOT_HAVE_DELETE_PERMISSION]:
    "Failed to delete tag: you don't have permission.",
};
