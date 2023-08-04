import { ArticleEntity, ArticleAttributes } from '../../model/content';

export interface IArticleFactory {
  createArticle(props: { groupIds?: string[]; userId: string }): ArticleEntity;
  reconstitute(props: ArticleAttributes): ArticleEntity;
}

export const ARTICLE_FACTORY_TOKEN = 'ARTICLE_FACTORY_TOKEN';
