import { HTTP_STATUS_ID } from './http-status-id';

export const HTTP_MESSAGES = {
  [HTTP_STATUS_ID.API_UNAUTHORIZED]: 'You must be logged in to perform this action',
  [HTTP_STATUS_ID.APP_AUTH_TOKEN_EXPIRED]: 'Auth token expired',
  [HTTP_STATUS_ID.API_FORBIDDEN]: 'Unable to perform this action',
  [HTTP_STATUS_ID.APP_POST_SETTING_DISABLE]:
    'You cannot perform this action because post setting is disable',
  [HTTP_STATUS_ID.APP_USER_EXISTING]: 'Unable to find the user',
  [HTTP_STATUS_ID.APP_COMMENT_EXISTING]: 'Unable to find the comment',
  [HTTP_STATUS_ID.APP_COMMENT_REPLY_EXISTING]: 'Unable to find the comment to reply',
  [HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY]: 'Content or media of post is empty',
  [HTTP_STATUS_ID.APP_POST_EXISTING]: 'Unable to find the post',
  [HTTP_STATUS_ID.APP_REACTION_EXISTING]: 'Exceed reaction kind limit',
};
