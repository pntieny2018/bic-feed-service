export enum PostAllow {
  COMMENT = 'canComment',
  REACT = 'canReact',
  SHARE = 'canShare',
}

export enum PostLang {
  VI = 'vi',
  EN = 'en',
}

export enum PostPrivacy {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PRIVATE = 'PRIVATE',
  SECRET = 'SECRET',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  PUBLISHED = 'PUBLISHED',
  WAITING_SCHEDULE = 'WAITING_SCHEDULE',
  SCHEDULE_FAILED = 'SCHEDULE_FAILED',
}

export enum PostType {
  POST = 'POST',
  ARTICLE = 'ARTICLE',
  SERIES = 'SERIES',
}
