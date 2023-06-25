import { ArticleMessagePayload } from './article.message-payload';

export class ArticleChangedMessagePayload {
  public state: 'publish' | 'update' | 'delete';
  public before?: ArticleMessagePayload;
  public after?: ArticleMessagePayload & {
    state?: {
      attachGroupIds: string[];
      detachGroupIds: string[];
    };
  };

  public constructor(data: Partial<ArticleChangedMessagePayload>) {
    Object.assign(this, data);
  }
}
