import { ReportEntity } from '../../../domain/model/report';
import { ReportDto } from '../../dto';

export interface IReportBinding {
  binding(reportEntity: ReportEntity): ReportDto;
}
export const REPORT_BINDING_TOKEN = 'REPORT_BINDING_TOKEN';
