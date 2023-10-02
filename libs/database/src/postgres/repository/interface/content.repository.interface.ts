import { CONTENT_STATUS, CONTENT_TYPE, ORDER } from '@beincom/constants';
import { PostAttributes } from '@libs/database/postgres/model/post.model';
import { WhereOptions } from 'sequelize';
import { CursorPaginationProps } from '@libs/database/postgres/common';
import { ReportContentDetailAttributes } from '@libs/database/postgres/model/report-content-detail.model';

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
  sortColumn?: keyof PostAttributes;
  orderBy?: ORDER;
};

export type FindContentProps = {
  where: FindContentConditionOptions;
  include?: FindContentIncludeOptions;
  attributes?: { exclude?: (keyof PostAttributes)[] };
  orderOptions?: OrderOptions;
};

export type GetPaginationContentsProps = FindContentProps & CursorPaginationProps;
