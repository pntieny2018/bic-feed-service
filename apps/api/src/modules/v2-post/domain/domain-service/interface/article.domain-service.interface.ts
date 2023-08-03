import { ArticleEntity } from '../../model/content';
import { UserDto } from '../../../../v2-user/application';

export type ArticlePayload = {
  id: string;
  title?: string;
  summary?: string;
  content?: string;
  categories?: string[];
  series?: string[];
  tags?: string[];
  groupIds?: string[];
  coverMedia?: {
    id: string;
  };
  wordCount?: number;
  scheduledAt?: Date;
};

export type UpdateArticleProps = {
  articleEntity: ArticleEntity;
  newData: ArticlePayload;
  actor: UserDto;
};

export type PublishArticleProps = {
  articleEntity: ArticleEntity;
  newData: ArticlePayload;
  actor: UserDto;
};

export type ScheduleArticleProps = {
  payload: ArticlePayload;
  actor: UserDto;
};

export interface IArticleDomainService {
  update(input: UpdateArticleProps): Promise<void>;
  publish(input: PublishArticleProps): Promise<void>;
  schedule(input: ScheduleArticleProps): Promise<ArticleEntity>;
  autoSave(inputData: UpdateArticleProps): Promise<void>;
}
export const ARTICLE_DOMAIN_SERVICE_TOKEN = 'ARTICLE_DOMAIN_SERVICE_TOKEN';
