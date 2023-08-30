export enum MediaStatus {
  WAITING_PROCESS = 'waiting_process',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  DONE = 'DONE',
  FAILED = 'ERROR',
}

export enum MediaType {
  VIDEO = 'video',
  IMAGE = 'image',
  FILE = 'file',
}

export enum ImageResource {
  POST_CONTENT = 'post:content',
  ARTICLE_COVER = 'article:cover',
  SERIES_COVER = 'series:cover',
  COMMENT_CONTENT = 'comment:content',
  ARTICLE_CONTENT = 'article:content',
}
