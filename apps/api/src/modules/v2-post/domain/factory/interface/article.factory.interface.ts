import { ArticleEntity, ArticleProps } from '../../model/content/article.entity';
import { PostEntity } from '../../model/content';

export interface IArticleFactory {
  createArticle(props: { groupIds?: string[]; userId: string }): ArticleEntity;
  reconstitute(props: ArticleProps): ArticleEntity;
}

export const ARTICLE_FACTORY_TOKEN = 'ARTICLE_FACTORY_TOKEN';
