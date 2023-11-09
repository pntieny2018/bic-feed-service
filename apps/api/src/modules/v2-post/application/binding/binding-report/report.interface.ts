import { ReportEntity } from '../../../domain/model/report';
import { ReportDto } from '../../dto';

export interface IReportBinding {
  binding(reportEntity: ReportEntity): ReportDto;
  bindingList(entities: ReportEntity[]): Promise<ReportDto[]>;
}
export const REPORT_BINDING_TOKEN = 'REPORT_BINDING_TOKEN';
