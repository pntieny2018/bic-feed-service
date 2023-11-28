import { CONTENT_REPORT_REASON_TYPE } from '@beincom/constants';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
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

import { ReportModel } from './report.model';

export type ReportDetailAttributes = InferAttributes<ReportDetailModel>;
@Table({
  tableName: 'report_details',
  paranoid: false,
})
export class ReportDetailModel extends Model<
  ReportDetailAttributes,
  InferCreationAttributes<ReportDetailModel>
> {
  @PrimaryKey
  @Default(() => uuid_v4())
  @Column({ type: DataTypes.UUID })
  public id: string;

  @ForeignKey(() => ReportModel)
  @Column({ type: DataTypes.UUID })
  public reportId: string;

  @Column({ type: DataTypes.UUID })
  public reporterId: string;

  @Column({ type: DataTypes.ENUM({ values: Object.values(CONTENT_REPORT_REASON_TYPE) }) })
  public reasonType: CONTENT_REPORT_REASON_TYPE;

  @Column({ type: DataTypes.STRING })
  public reason?: string;

  @CreatedAt
  @Column({ type: DataTypes.DATE })
  public createdAt?: Date;

  @UpdatedAt
  @Column({ type: DataTypes.DATE })
  public updatedAt?: Date;
}
