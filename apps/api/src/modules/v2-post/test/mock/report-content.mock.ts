import { CONTENT_REPORT_REASON_TYPE, CONTENT_TARGET } from '@beincom/constants';
import {
  ReportContentDetailAttributes,
  REPORT_SCOPE,
} from '@libs/database/postgres/model/report-content-detail.model';
import { v4 } from 'uuid';

export function createMockReportContentDetailRecord(
  data: Partial<ReportContentDetailAttributes> = {}
): ReportContentDetailAttributes {
  return {
    id: v4(),
    targetId: v4(),
    targetType: CONTENT_TARGET.POST,
    groupId: v4(),
    createdBy: v4(),
    reportTo: REPORT_SCOPE.GROUP,
    reportId: v4(),
    reasonType: CONTENT_REPORT_REASON_TYPE.SPAM,
    reason: 'This is spam',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}
