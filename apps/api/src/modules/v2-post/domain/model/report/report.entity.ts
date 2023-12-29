import { CONTENT_REPORT_REASON_TYPE, CONTENT_TARGET } from '@beincom/constants';
import { REPORT_SCOPE, REPORT_STATUS } from '@libs/database/postgres/model';
import { uniq } from 'lodash';
import { v4, validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';

export type ReportDetailAttributes = {
  id: string;
  reportId: string;
  targetId: string;
  reporterId: string;
  reasonType: CONTENT_REPORT_REASON_TYPE;
  reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReportAttributes = {
  id: string;
  groupId: string;
  reportTo: REPORT_SCOPE;
  targetId: string;
  targetType: CONTENT_TARGET;
  targetActorId: string;
  reasonsCount: ReasonCount[];
  status: REPORT_STATUS;
  processedBy?: string;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReasonCount = {
  reasonType: CONTENT_REPORT_REASON_TYPE;
  total: number;
  reporterIds: string[];
};

type ReportState = {
  attachDetails?: ReportDetailAttributes[];
};

type AddReportDetailProps = Pick<
  ReportDetailAttributes,
  'targetId' | 'reporterId' | 'reasonType' | 'reason'
>;

export class ReportEntity extends DomainAggregateRoot<ReportAttributes> {
  protected _state: ReportState;

  public constructor(props: ReportAttributes) {
    super(props);
    this._initState();
  }

  private _initState(): void {
    this._state = {
      attachDetails: [],
    };
  }

  public validate(): void {
    if (this._props.id && !isUUID(this._props.id)) {
      throw new DomainModelException(`Report ID must be UUID`);
    }
    if (this._props.groupId && !isUUID(this._props.groupId)) {
      throw new DomainModelException(`Group ID must be UUID`);
    }
    if (this._props.targetId && !isUUID(this._props.targetId)) {
      throw new DomainModelException(`Target ID must be UUID`);
    }
    if (this._props.targetActorId && !isUUID(this._props.targetActorId)) {
      throw new DomainModelException(`Author ID By must be UUID`);
    }
  }

  public static create(
    report: Partial<ReportAttributes>,
    reportDetail: AddReportDetailProps
  ): ReportEntity {
    const { groupId, targetId, targetType, targetActorId } = report;
    const { reporterId, reasonType } = reportDetail;

    const reportId = v4();
    const now = new Date();

    const reportEntity = new ReportEntity({
      id: reportId,
      groupId,
      reportTo: REPORT_SCOPE.COMMUNITY,
      targetId,
      targetType,
      targetActorId,
      reasonsCount: [{ reasonType: reasonType, total: 1, reporterIds: [reporterId] }],
      status: REPORT_STATUS.CREATED,
      createdAt: now,
      updatedAt: now,
    });

    reportEntity.addReportDetail(reportDetail);

    return reportEntity;
  }

  public increaseReasonsCount(reasonType: CONTENT_REPORT_REASON_TYPE, reporterId: string): void {
    const isExistReasonType = this._props.reasonsCount.some(
      (reasonCount) => reasonCount.reasonType === reasonType
    );

    if (isExistReasonType) {
      this._props.reasonsCount = this._props.reasonsCount.map((reasonCount) =>
        reasonCount.reasonType === reasonType
          ? {
              ...reasonCount,
              total: reasonCount.total + 1,
              reporterIds: uniq([...reasonCount.reporterIds, reporterId]),
            }
          : reasonCount
      );
    } else {
      this._props.reasonsCount.push({ reasonType, total: 1, reporterIds: [reporterId] });
    }
  }

  public addReportDetail(props: AddReportDetailProps): void {
    const { targetId, reporterId, reasonType, reason } = props;
    const now = new Date();

    this._state.attachDetails.push({
      id: v4(),
      reportId: this._props.id,
      targetId,
      reporterId,
      reasonType,
      reason,
      createdAt: now,
      updatedAt: now,
    });
  }

  public getState(): ReportState {
    return this._state;
  }

  public getReasonsCount(): ReasonCount[] {
    return this._props.reasonsCount || [];
  }

  public isCreated(): boolean {
    return this._props.status === REPORT_STATUS.CREATED;
  }

  public isIgnored(): boolean {
    return this._props.status === REPORT_STATUS.IGNORED;
  }

  public isHidden(): boolean {
    return this._props.status === REPORT_STATUS.HIDDEN;
  }

  public updateStatus(status: REPORT_STATUS, processedBy: string): void {
    this._props.status = status;
    this._props.processedBy = processedBy;
    this._props.processedAt = new Date();
  }
}
