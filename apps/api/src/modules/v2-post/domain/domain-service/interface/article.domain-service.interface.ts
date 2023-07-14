import { ArticleEntity } from '../../model/content';
import { UpdateArticleCommandPayload } from '../../../application/command/update-article/update-article.command';

export type ArticlePayload = UpdateArticleCommandPayload;

export type UpdateArticleProps = {
  articleEntity: ArticleEntity;
  newData: ArticlePayload;
};

export type PublishArticleProps = {
  articleEntity: ArticleEntity;
  newData: ArticlePayload;
};

export interface IArticleDomainService {
  update(input: UpdateArticleProps): Promise<void>;
  publish(input: PublishArticleProps): Promise<void>;
  autoSave(inputData: UpdateArticleProps): Promise<void>;
}
export const ARTICLE_DOMAIN_SERVICE_TOKEN = 'ARTICLE_DOMAIN_SERVICE_TOKEN';
