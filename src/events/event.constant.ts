export enum AppEvent {
  POST_CREATED = 'post.created',
  POST_UPDATED = 'post.updated',
  POST_DELETED = 'post.deleted',
  POST_REACTED = 'post.reacted',
  POST_PUBLISHED = 'post.published',
  POST_REACTION_DELETED = 'post.reaction.deleted',

  COMMENT_CREATED = 'comment.created',
  COMMENT_UPDATED = 'comment.updated',
  COMMENT_DELETED = 'comment.deleted',
  COMMENT_REACTED = 'comment.reacted',
  COMMENT_REACTION_DELETED = 'comment.reaction.deleted',

  UN_REACTED = 'entity.un-reacted',
}
