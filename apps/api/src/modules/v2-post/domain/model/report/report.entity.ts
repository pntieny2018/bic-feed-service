import { CONTENT_REPORT_REASON_TYPE, CONTENT_TARGET } from '@beincom/constants';
import { REPORT_SCOPE, REPORT_STATUS } from '@libs/database/postgres/model';
import { v4, validate as isUUID } from 'uuid';

import { DomainAggregateRoot } from '../../../../../common/domain-model/domain-aggregate-root';
import { DomainModelException } from '../../../../../common/exceptions';

export type ReportDetailAttributes = {
  id: string;
  reportId: string;
  targetId: string;
  targetType: CONTENT_TARGET;
  groupId: string;
  createdBy: string;
  reportTo: REPORT_SCOPE;
  reasonType: CONTENT_REPORT_REASON_TYPE;
  reason?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReportAttributes = {
  id: string;
  targetId: string;
  targetType: CONTENT_TARGET;
  authorId: string;
  status: REPORT_STATUS;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  details?: ReportDetailAttributes[];
};

type CreateReportDetailProps = Pick<
  ReportDetailAttributes,
  'groupId' | 'createdBy' | 'reasonType' | 'reason'
>;

type ReportState = {
  attachDetails?: ReportDetailAttributes[];
};

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

  public static create(
    report: Partial<ReportAttributes>,
    details: CreateReportDetailProps[]
  ): ReportEntity {
    const { targetId, targetType, authorId, status } = report;

    const reportId = v4();
    const now = new Date();

    return new ReportEntity({
      id: v4(),
      targetId,
      targetType,
      authorId,
      status,
      details: details.map((detail) => ({
        id: v4(),
        reportId,
        targetId,
        targetType,
        groupId: detail.groupId,
        createdBy: detail.createdBy,
        reportTo: REPORT_SCOPE.COMMUNITY,
        reasonType: detail.reasonType,
        reason: detail.reason,
        createdAt: now,
        updatedAt: now,
      })),
      createdAt: now,
      updatedAt: now,
    });
  }

  public validate(): void {
    if (this._props.id && !isUUID(this._props.id)) {
      throw new DomainModelException(`Report ID must be UUID`);
    }
    if (this._props.targetId && !isUUID(this._props.targetId)) {
      throw new DomainModelException(`Target ID must be UUID`);
    }
    if (this._props.authorId && !isUUID(this._props.authorId)) {
      throw new DomainModelException(`Author ID By must be UUID`);
    }
  }

  public getState(): ReportState {
    return this._state;
  }

  public getDetails(): ReportDetailAttributes[] {
    return this._props.details || [];
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

  public updateStatus(status: REPORT_STATUS): void {
    this._props.status = status;
  }

  public addDetails(details: CreateReportDetailProps[]): void {
    const newDetails = details.map((detail) => this._createDetail(detail));
    this._props.details = [...this._props.details, ...newDetails];
    this._state.attachDetails = newDetails;
  }

  private _createDetail(detail: CreateReportDetailProps): ReportDetailAttributes {
    const { groupId, createdBy, reasonType, reason } = detail;

    return {
      id: v4(),
      reportId: this._props.id,
      targetId: this._props.targetId,
      targetType: this._props.targetType,
      groupId,
      createdBy,
      reportTo: REPORT_SCOPE.COMMUNITY,
      reasonType,
      reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
