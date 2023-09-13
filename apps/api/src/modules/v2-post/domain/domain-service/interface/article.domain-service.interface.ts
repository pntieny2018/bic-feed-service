import { CONTENT_STATUS, ORDER } from '@beincom/constants';
import { PaginatedArgs } from '@libs/database/postgres/common';
import { UserDto } from '@libs/service/user';

import { CursorPaginationResult } from '../../../../../common/types';
import {
  AutoSaveArticleCommandPayload,
  DeleteArticleCommandPayload,
  PublishArticleCommandPayload,
  UpdateArticleCommandPayload,
} from '../../../application/command/article';
import { ArticleEntity } from '../../model/content';

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

export type UpdateArticleProps = UpdateArticleCommandPayload;

export type PublishArticleProps = PublishArticleCommandPayload;

export type ScheduleArticleProps = {
  payload: ArticlePayload;
  actor: UserDto;
};

export type AutoSaveArticleProps = AutoSaveArticleCommandPayload;

export type DeleteArticleProps = DeleteArticleCommandPayload;

export class GetArticlesIdsScheduleProps extends PaginatedArgs {
  public statuses: [CONTENT_STATUS.WAITING_SCHEDULE, CONTENT_STATUS.SCHEDULE_FAILED];
  public order: ORDER;
  public user: UserDto;
}

export interface IArticleDomainService {
  getArticleById(id: string, authUser: UserDto): Promise<ArticleEntity>;
  getArticlesIdsSchedule(
    props: GetArticlesIdsScheduleProps
  ): Promise<CursorPaginationResult<string>>;
  deleteArticle(props: DeleteArticleProps): Promise<void>;
  update(input: UpdateArticleProps): Promise<ArticleEntity>;
  publish(input: PublishArticleProps): Promise<ArticleEntity>;
  schedule(input: ScheduleArticleProps): Promise<ArticleEntity>;
  autoSave(inputData: AutoSaveArticleProps): Promise<void>;
}
export const ARTICLE_DOMAIN_SERVICE_TOKEN = 'ARTICLE_DOMAIN_SERVICE_TOKEN';
