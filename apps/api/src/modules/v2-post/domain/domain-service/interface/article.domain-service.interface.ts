import { ArticleEntity } from '../../model/content';
import { UpdateArticleCommandPayload } from '../../../application/command/update-article/update-article.command';
import { UserDto } from 'apps/api/src/modules/v2-user/application';

export type UpdateArticleProps = {
  articleEntity: ArticleEntity;
  newData: UpdateArticleCommandPayload;
};

export type PublishArticleProps = {
  articleEntity: ArticleEntity;
  actor: UserDto;
};

export interface IArticleDomainService {
  update(input: UpdateArticleProps): Promise<void>;
  publish(input: PublishArticleProps): Promise<ArticleEntity>;
}
export const ARTICLE_DOMAIN_SERVICE_TOKEN = 'ARTICLE_DOMAIN_SERVICE_TOKEN';
