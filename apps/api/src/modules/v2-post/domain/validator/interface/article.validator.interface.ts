import { UserDto } from '@libs/service/user';

import { ArticleEntity } from '../../model/content';

export interface IArticleValidator {
  validateArticleToPublish(articleEntity: ArticleEntity, actor: UserDto): Promise<void>;
}

export const ARTICLE_VALIDATOR_TOKEN = 'ARTICLE_VALIDATOR_TOKEN';
