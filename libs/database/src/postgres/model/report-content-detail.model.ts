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

import { ReportTo } from '../../../../../apps/api/src/modules/report-content/contstants';

import { ReportContentModel } from './report-content.model';

export type ReportContentDetailAttribute = InferAttributes<ReportContentDetailModel>;
@Table({
  tableName: 'report_content_details',
  paranoid: false,
})
export class ReportContentDetailModel extends Model<
  ReportContentDetailAttribute,
  InferCreationAttributes<ReportContentDetailModel>
> {
  @PrimaryKey
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public targetId: string;

  @Column
  public targetType: string;

  @Column
  public groupId: string;

  @Column
  public createdBy: string;

  @Column
  public reportTo: ReportTo;

  @ForeignKey(() => ReportContentModel)
  @Column
  public reportId: string;

  @Column
  public reasonType: string;

  @Column
  public reason?: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
