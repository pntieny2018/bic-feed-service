import { CONTENT_STATUS, CONTENT_TYPE, ORDER } from '@beincom/constants';
import { CursorPaginationProps } from '@libs/database/postgres/common';
import { PostAttributes } from '@libs/database/postgres/model';

export type FindContentConditionOptions = {
  type?: CONTENT_TYPE;
  id?: string;
  ids?: string[];
  groupArchived?: boolean;
  excludeReportedByUserId?: string;
  groupIds?: string[];
  createdBy?: string;
  isImportant?: boolean;
  scheduledAt?: Date;
  isHidden?: boolean;
  savedByUserId?: string;
  status?: CONTENT_STATUS;
  statuses?: CONTENT_STATUS[];
  inNewsfeedUserId?: string;
};

export type FindContentIncludeOptions = {
  mustIncludeGroup?: boolean;
  mustIncludeSaved?: {
    userId?: string;
  };
  shouldIncludeGroup?: boolean;
  shouldIncludeSeries?: boolean;
  shouldIncludeItems?: boolean;
  shouldIncludeCategory?: boolean;
  shouldIncludeQuiz?: boolean;
  shouldIncludeLinkPreview?: boolean;
  shouldIncludeReaction?: {
    userId?: string;
  };
  shouldIncludeSaved?: {
    userId?: string;
  };

  shouldIncludeMarkReadImportant?: {
    userId: string;
  };
  shouldIncludeImportant?: {
    userId: string;
  };
};

export type OrderOptions = {
  isImportantFirst?: boolean;
  isPublishedByDesc?: boolean;
  isSavedDateByDesc?: boolean;
  sortColumn?: keyof PostAttributes;
  orderBy?: ORDER;
  createdAtDesc?: boolean;
};

export type FindContentProps = {
  select?: (keyof PostAttributes)[];
  where: FindContentConditionOptions;
  include?: FindContentIncludeOptions;
  attributes?: { exclude?: (keyof PostAttributes)[] };
  orderOptions?: OrderOptions;
};

export type GetPaginationContentsProps = FindContentProps & CursorPaginationProps;
