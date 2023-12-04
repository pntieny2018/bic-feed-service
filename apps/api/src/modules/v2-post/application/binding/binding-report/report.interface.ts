import { ReportEntity } from '../../../domain/model/report';
import { ReportDto, ReportForManagerDto } from '../../dto';

export interface IReportBinding {
  binding(reportEntity: ReportEntity): ReportDto;
  bindingReportsForManager(entities: ReportEntity[]): Promise<ReportForManagerDto[]>;
}
export const REPORT_BINDING_TOKEN = 'REPORT_BINDING_TOKEN';
