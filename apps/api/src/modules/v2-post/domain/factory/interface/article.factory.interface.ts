import { ArticleEntity, ArticleProps } from '../../model/post/article.entity';

export interface IArticleFactory {
  reconstitute(props: ArticleProps): ArticleEntity;
}

export const ARTICLE_FACTORY_TOKEN = 'ARTICLE_FACTORY_TOKEN';
