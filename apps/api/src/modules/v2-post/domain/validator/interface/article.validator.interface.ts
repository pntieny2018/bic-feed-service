import { UserDto } from '@libs/service/user';

import { ArticleEntity } from '../../model/content';

export interface IArticleValidator {
  validateArticle(articleEntity: ArticleEntity, actor: UserDto): Promise<void>;
  validateArticleToPublish(articleEntity: ArticleEntity): void;
}

export const ARTICLE_VALIDATOR_TOKEN = 'ARTICLE_VALIDATOR_TOKEN';
