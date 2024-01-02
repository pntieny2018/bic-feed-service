import { ContentEntity } from '@api/modules/v2-post/domain/model/content';
import { CONTENT_TYPE } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { UserNewsFeedAttributes } from '@libs/database/postgres/model';

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

export type ContentNewsFeedAttributes = Pick<
  UserNewsFeedAttributes,
  'id' | 'type' | 'publishedAt' | 'isImportant' | 'createdBy'
>;

export interface IUserNewsfeedRepository {
  attachContentToUserId(contentEntity: ContentEntity, userId: string): Promise<void>;
  detachContentIdFromUserId(contentId: string, userId: string): Promise<void>;
  detachContentIdFromAllUsers(contentId: string): Promise<void>;
  getContentIdsCursorPaginationByUserId(
    getNewsfeedPaginationProps: GetContentIdsCursorPaginationByUserIdProps
  ): Promise<CursorPaginationResult<string>>;

  getImportantContentIdsCursorPaginationByUserId(
    getNewsfeedPaginationProps: GetImportantContentIdsCursorPaginationByUserIdProps
  ): Promise<CursorPaginationResult<string>>;
}

export const USER_NEWSFEED_REPOSITORY_TOKEN = 'USER_NEWSFEED_REPOSITORY_TOKEN';
