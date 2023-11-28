import { CONTENT_REPORT_REASON_TYPE, CONTENT_TARGET } from '@beincom/constants';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  Column,
  CreatedAt,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { ReportContentModel } from './report-content.model';

export enum REPORT_SCOPE {
  GROUP = 'GROUP',
  COMMUNITY = 'COMMUNITY',
}

export type ReportContentDetailAttributes = InferAttributes<ReportContentDetailModel>;

// TODO: Remove this model
@Table({
  tableName: 'report_content_details',
  paranoid: false,
})
export class ReportContentDetailModel extends Model<
  ReportContentDetailAttributes,
  InferCreationAttributes<ReportContentDetailModel>
> {
  @PrimaryKey
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public targetId: string;

  @Column
  public targetType: CONTENT_TARGET;

  @Column
  public groupId: string;

  @Column
  public createdBy: string;

  @Column
  public reportTo: REPORT_SCOPE;

  @ForeignKey(() => ReportContentModel)
  @Column
  public reportId: string;

  @Column
  public reasonType: CONTENT_REPORT_REASON_TYPE;

  @Column
  public reason?: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
