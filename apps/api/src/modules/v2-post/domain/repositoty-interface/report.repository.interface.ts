import { CONTENT_TARGET } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { REPORT_STATUS } from '@libs/database/postgres/model';

import { ReportEntity } from '../model/report';

type IncludeReportProps = {
  details?: boolean;
};

export type FindOneReportProps = {
  where: {
    id?: string;
    targetId?: string;
    targetType?: CONTENT_TARGET;
    targetActorId?: string;
    status?: REPORT_STATUS;
  };
  include?: IncludeReportProps;
};

export type GetPaginationReportProps = {
  where: {
    targetType?: CONTENT_TARGET[];
    targetActorId?: string;
    status?: REPORT_STATUS;
    groupId?: string;
  };
  include?: IncludeReportProps;
} & CursorPaginationProps;

export interface IReportRepository {
  findOne(input: FindOneReportProps): Promise<ReportEntity>;
  getPagination(input: GetPaginationReportProps): Promise<CursorPaginationResult<ReportEntity>>;
  create(reportEntity: ReportEntity): Promise<void>;
  update(reportEntity: ReportEntity): Promise<void>;
}

export const REPORT_REPOSITORY_TOKEN = 'REPORT_REPOSITORY_TOKEN';
