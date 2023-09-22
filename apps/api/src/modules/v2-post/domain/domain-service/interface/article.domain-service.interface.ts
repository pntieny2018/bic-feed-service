import { UserDto } from '@libs/service/user';

import { MediaItemDto } from '../../../application/dto';
import { ArticleEntity } from '../../model/content';

export type ArticlePayload = {
  id: string;
  title?: string;
  summary?: string;
  content?: string;
  categoryIds?: string[];
  seriesIds?: string[];
  tagIds?: string[];
  groupIds?: string[];
  coverMedia?: MediaItemDto;
  wordCount?: number;
};

export type UpdateArticleProps = {
  payload: ArticlePayload;
  actor: UserDto;
};

export type PublishArticleProps = {
  payload: ArticlePayload;
  actor: UserDto;
};

export type ScheduleArticleProps = {
  payload: ArticlePayload & { scheduledAt: Date };
  actor: UserDto;
};

export type AutoSaveArticleProps = {
  payload: ArticlePayload;
  actor: UserDto;
};

export type DeleteArticleProps = {
  id: string;
  actor: UserDto;
};

export interface IArticleDomainService {
  getArticleById(id: string, authUser: UserDto): Promise<ArticleEntity>;
  delete(input: DeleteArticleProps): Promise<void>;
  update(input: UpdateArticleProps): Promise<ArticleEntity>;
  publish(input: PublishArticleProps): Promise<ArticleEntity>;
  schedule(input: ScheduleArticleProps): Promise<ArticleEntity>;
  autoSave(inputData: AutoSaveArticleProps): Promise<void>;
}
export const ARTICLE_DOMAIN_SERVICE_TOKEN = 'ARTICLE_DOMAIN_SERVICE_TOKEN';
