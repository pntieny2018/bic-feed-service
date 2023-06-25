import { ArticleEntity } from '../../model/content';
import { UserDto } from '../../../../v2-user/application';

export type ValidationPayload = {
  groupIds: string[];
  seriesIds: string[];
  tagIds: string[];
  categoryIds: string[];
};

export interface IArticleValidator {
  validatePublishAction(articleEntity: ArticleEntity, actor: UserDto): Promise<void>;

  validateUpdateAction(
    articleEntity: ArticleEntity,
    actor: UserDto,
    payload: ValidationPayload
  ): Promise<void>;
}

export const ARTICLE_VALIDATOR_TOKEN = 'ARTICLE_VALIDATOR_TOKEN';
