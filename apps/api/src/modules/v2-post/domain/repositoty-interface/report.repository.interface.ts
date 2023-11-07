import { ReportEntity } from '../model/report';

export interface IReportRepository {
  findReportByTargetId(targetId: string): Promise<ReportEntity>;
  createReport(reportEntity: ReportEntity): Promise<void>;
  updateReport(reportEntity: ReportEntity): Promise<void>;
}

export const REPORT_REPOSITORY_TOKEN = 'REPORT_REPOSITORY_TOKEN';
