import { CONTENT_STATUS } from '@beincom/constants';
import { UserDto } from '@libs/service/user';

import { PageOptionsDto } from '../../../../../common/dto';
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

export class GetArticleByParamsProps extends PageOptionsDto {
  public statuses: CONTENT_STATUS[];
  public user: UserDto;
}

export interface IArticleDomainService {
  getArticleById(id: string, authUser: UserDto): Promise<ArticleEntity>;
  getScheduleArticle(params: GetArticleByParamsProps): Promise<ArticleEntity[]>;
  deleteArticle(props: DeleteArticleProps): Promise<void>;
  update(input: UpdateArticleProps): Promise<ArticleEntity>;
  publish(input: PublishArticleProps): Promise<ArticleEntity>;
  schedule(input: ScheduleArticleProps): Promise<ArticleEntity>;
  autoSave(inputData: AutoSaveArticleProps): Promise<void>;
}
export const ARTICLE_DOMAIN_SERVICE_TOKEN = 'ARTICLE_DOMAIN_SERVICE_TOKEN';
