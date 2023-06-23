import { ArticleEntity } from '../../model/content';
import { UpdateArticleCommandPayload } from '../../../application/command/update-article/update-article.command';

export type UpdateArticleProps = {
  articleEntity: ArticleEntity;
  newData: UpdateArticleCommandPayload;
};

export interface IArticleDomainService {
  update(input: UpdateArticleProps): Promise<void>;
}
export const ARTICLE_DOMAIN_SERVICE_TOKEN = 'ARTICLE_DOMAIN_SERVICE_TOKEN';
