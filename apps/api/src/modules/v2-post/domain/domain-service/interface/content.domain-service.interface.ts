import { PostType } from '../../../data-type';
import { OrderEnum } from '../../../../../common/dto';
import { UserDto } from '../../../../v2-user/application';
import { ArticleEntity, PostEntity, SeriesEntity, ContentEntity } from '../../model/content';
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
export interface IContentDomainService {
  getVisibleContent(id: string): Promise<ContentEntity>;
  getRawContent(contentEntity: ContentEntity): string;

  getContentByIds(
    data: GetContentByIdsProps
  ): Promise<(PostEntity | ArticleEntity | SeriesEntity)[]>;
  getDraftsPagination(
    data: GetDraftsProps
  ): Promise<CursorPaginationResult<PostEntity | ArticleEntity | SeriesEntity>>;
}
export const CONTENT_DOMAIN_SERVICE_TOKEN = 'CONTENT_DOMAIN_SERVICE_TOKEN';
