import { ReportEntity } from '../../../domain/model/report';
import { ReportDto, ReportForManageDto } from '../../dto';

export interface IReportBinding {
  binding(reportEntity: ReportEntity): ReportDto;
  bindingReportsForManage(entities: ReportEntity[]): Promise<ReportForManageDto[]>;
}
export const REPORT_BINDING_TOKEN = 'REPORT_BINDING_TOKEN';
