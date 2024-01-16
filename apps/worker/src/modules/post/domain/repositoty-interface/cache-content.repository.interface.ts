export interface ICacheContentRepository {
  deleteContents(contentIds: string[]): Promise<void>;
}

export const CACHE_CONTENT_REPOSITORY_TOKEN = 'CACHE_CONTENT_REPOSITORY_TOKEN';
