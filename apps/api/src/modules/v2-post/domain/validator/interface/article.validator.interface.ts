import { ArticleEntity } from '../../model/content';
import { UserDto } from '../../../../v2-user/application';

export interface IArticleValidator {
  validatePublishAction(articleEntity: ArticleEntity, actor: UserDto): Promise<void>;

  validateUpdateAction(articleEntity: ArticleEntity, actor: UserDto): Promise<void>;
}

export const ARTICLE_VALIDATOR_TOKEN = 'ARTICLE_VALIDATOR_TOKEN';
