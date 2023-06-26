import { ArticleMessagePayload } from './article.message-payload';

export class ArticleChangedMessagePayload {
  public state: 'publish' | 'update' | 'delete';
  public before?: ArticleMessagePayload;
  public after?: ArticleMessagePayload & {
    state?: {
      attachGroupIds: string[];
      detachGroupIds: string[];
      attachTagIds?: string[];
      detachTagIds?: string[];
      attachSeriesIds?: string[];
      detachSeriesIds?: string[];
    };
  };

  public constructor(data: Partial<ArticleChangedMessagePayload>) {
    Object.assign(this, data);
  }
}
