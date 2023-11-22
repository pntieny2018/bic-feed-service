import { CONTENT_REPORT_REASON_TYPE, CONTENT_TARGET } from '@beincom/constants';
import { REPORT_STATUS, ReportContentAttribute } from '@libs/database/postgres/model';
import {
  ReportContentDetailAttributes,
  REPORT_SCOPE,
} from '@libs/database/postgres/model/report-content-detail.model';
import { v4 } from 'uuid';

import { ReportEntity } from '../../domain/model/report';

export function createMockReportRecord(
  data: Partial<ReportContentAttribute> = {}
): ReportContentAttribute {
  const id = v4();
  const targetId = v4();
  return {
    id,
    targetId,
    targetType: CONTENT_TARGET.POST,
    authorId: v4(),
    status: REPORT_STATUS.CREATED,
    updatedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    details: [createMockReportDetailRecord({ id, targetId })],
    ...data,
  };
}

export function createMockReportDetailRecord(
  data: Partial<ReportContentDetailAttributes> = {}
): ReportContentDetailAttributes {
  return {
    id: v4(),
    targetId: v4(),
    targetType: CONTENT_TARGET.POST,
    groupId: v4(),
    createdBy: v4(),
    reportTo: REPORT_SCOPE.COMMUNITY,
    reportId: v4(),
    reasonType: CONTENT_REPORT_REASON_TYPE.SPAM,
    reason: 'This is spam',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}

export function createMockReportEntity(data: Partial<ReportContentAttribute> = {}): ReportEntity {
  const report = createMockReportRecord(data);
  const { authorId: targetActorId, ...restReport } = report;
  return new ReportEntity({ targetActorId, ...restReport });
}
