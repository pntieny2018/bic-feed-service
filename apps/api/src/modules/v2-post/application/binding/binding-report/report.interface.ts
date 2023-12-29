import { ReasonCount, ReportEntity } from '../../../domain/model/report';
import { ReportDto, ReportForManagerDto, ReportReasonCountDto } from '../../dto';

export interface IReportBinding {
  binding(reportEntity: ReportEntity): ReportDto;
  bindingReportsWithReportersInReasonsCount(entities: ReportEntity[]): Promise<ReportDto[]>;
  bindingReportsForManager(entities: ReportEntity[]): Promise<ReportForManagerDto[]>;
  bindingReportReasonsCount(reasonsCount: ReasonCount[]): ReportReasonCountDto[];
  bindingReportReasonsCountWithReporters(
    reasonsCount: ReasonCount[]
  ): Promise<ReportReasonCountDto[]>;
}
export const REPORT_BINDING_TOKEN = 'REPORT_BINDING_TOKEN';
