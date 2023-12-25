import { ContentEntity } from '@api/modules/v2-post/domain/model/content';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { CONTENT_TYPE } from '@beincom/constants';

export type GetContentIdsCursorPaginationByUserIdProps = {
  userId: string;
  isImportant?: boolean;
  isSavedBy?: string;
  createdBy?: string;
  type?: CONTENT_TYPE;
} & Pick<CursorPaginationProps, 'limit' | 'after'>;

export type GetImportantContentIdsCursorPaginationByUserIdProps = {
  userId: string;
  type?: CONTENT_TYPE;
} & Pick<CursorPaginationProps, 'limit' | 'after'>;
export interface IUserNewsfeedRepository {
  hasPublishedContentIdToUserId(contentId: string, userId: string): Promise<boolean>;
  attachContentIdToUserId(contentEntity: ContentEntity, userId: string): Promise<void>;
  detachContentIdFromUserId(contentId: string, userId: string): Promise<void>;
  getContentIdsCursorPaginationByUserId(
    getNewsfeedPaginationProps: GetContentIdsCursorPaginationByUserIdProps
  ): Promise<CursorPaginationResult<string>>;

  getImportantContentIdsCursorPaginationByUserId(
    getNewsfeedPaginationProps: GetImportantContentIdsCursorPaginationByUserIdProps
  ): Promise<CursorPaginationResult<string>>;
}

export const USER_NEWSFEED_REPOSITORY_TOKEN = 'USER_NEWSFEED_REPOSITORY_TOKEN';
