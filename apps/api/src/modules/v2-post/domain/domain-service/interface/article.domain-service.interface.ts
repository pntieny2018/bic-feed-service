import { ArticleEntity } from '../../model/content';
import { MediaDto } from '../../../driving-apdater/dto/request';
import { UserDto } from '../../../../v2-user/application/user.dto';

export type ArticlePayload = {
  id: string;

  actor: UserDto;

  title?: string;

  summary?: string;

  content?: string;

  categories?: string[];

  series?: string[];

  tags?: string[];

  groupIds?: string[];

  coverMedia?: MediaDto;

  wordCount?: number;

  scheduledAt?: Date;
};

export type UpdateArticleProps = {
  articleEntity: ArticleEntity;
  newData: ArticlePayload;
};

export type PublishArticleProps = {
  articleEntity: ArticleEntity;
  newData: ArticlePayload;
};

export type ScheduleArticleProps = {
  articleEntity: ArticleEntity;
  newData: ArticlePayload;
};

export interface IArticleDomainService {
  update(input: UpdateArticleProps): Promise<void>;
  publish(input: PublishArticleProps): Promise<void>;
  schedule(input: ScheduleArticleProps): Promise<void>;
  autoSave(inputData: UpdateArticleProps): Promise<void>;
}
export const ARTICLE_DOMAIN_SERVICE_TOKEN = 'ARTICLE_DOMAIN_SERVICE_TOKEN';
