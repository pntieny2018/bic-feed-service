import { PostType } from '../../../data-type';
import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';
import { ArticleEntity, PostEntity, SeriesEntity } from '../../model/content';
import { CursorPaginationResult } from '../../../../../common/types/cursor-pagination-result.type';

export type GetDraftsProps = {
  authUser: UserDto;
  limit: number;
  order: OrderEnum;
  isProcessing?: boolean;
  type?: PostType;
  before?: string;
  after?: string;
};

export type GetContentByIdsProps = {
  authUser?: UserDto;
  ids: string[];
};

export type GetScheduledContentProps = {
  limit: number;
  order: OrderEnum;
  before?: string;
  after?: string;
  beforeDate: Date;
};

export interface IContentDomainService {
  getContentByIds(
    data: GetContentByIdsProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;
  getDraftsPagination(
    data: GetDraftsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
  getScheduledContentPagination(
    input: GetScheduledContentProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
}
export const CONTENT_DOMAIN_SERVICE_TOKEN = 'CONTENT_DOMAIN_SERVICE_TOKEN';
