import { ArticleEntity } from '../../model/content';
import { UserDto } from '../../../../v2-user/application';

export interface IArticleValidator {
  validateArticle(articleEntity: ArticleEntity, actor: UserDto): Promise<void>;
}

export const ARTICLE_VALIDATOR_TOKEN = 'ARTICLE_VALIDATOR_TOKEN';
