import { CONTENT_TARGET } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import { REPORT_STATUS } from '@libs/database/postgres/model';

import { ReportEntity } from '../model/report';

export type FindOneReportProps = {
  id?: string;
  groupId?: string;
  targetId?: string;
  targetType?: CONTENT_TARGET;
  targetActorId?: string;
  status?: REPORT_STATUS;
};

export type FindAllReportsProps = {
  groupIds?: string[];
  targetIds?: string[];
  status?: REPORT_STATUS;
};

export type GetPaginationReportProps = {
  targetType?: CONTENT_TARGET[];
  targetActorId?: string;
  status?: REPORT_STATUS;
  groupId?: string;
} & CursorPaginationProps;

export interface IReportRepository {
  create(reportEntity: ReportEntity): Promise<void>;
  update(reportEntity: ReportEntity): Promise<void>;
  findOne(input: FindOneReportProps): Promise<ReportEntity>;
  findAll(input: FindAllReportsProps): Promise<ReportEntity[]>;
  getPagination(input: GetPaginationReportProps): Promise<CursorPaginationResult<ReportEntity>>;
}

export const REPORT_REPOSITORY_TOKEN = 'REPORT_REPOSITORY_TOKEN';
