import { CONTENT_TARGET } from '@beincom/constants';
import {
  ReportContentDetailAttributes,
  ReportTo,
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
    reportTo: ReportTo.GROUP,
    reportId: v4(),
    reasonType: 'spam',
    reason: 'This is spam',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}
