import {
  CONTENT_REPORT_REASON_DESCRIPTION,
  CONTENT_REPORT_REASON_TYPE,
  CONTENT_TARGET,
} from '@beincom/constants';
import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import {
  Column,
  CreatedAt,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuid_v4 } from 'uuid';

import { REPORT_SCOPE } from './report-content-detail.model';
import { REPORT_STATUS } from './report-content.model';
import { ReportDetailAttributes, ReportDetailModel } from './report-detail.model';

type ReasonCount = {
  reasonType: CONTENT_REPORT_REASON_TYPE;
  description: CONTENT_REPORT_REASON_DESCRIPTION;
  total: number;
};

export type ReportAttribute = InferAttributes<ReportModel>;
@Table({
  tableName: 'reports',
  paranoid: false,
})
export class ReportModel extends Model<ReportAttribute, InferCreationAttributes<ReportModel>> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column({ type: DataTypes.UUID })
  public id: string;

  @Column({ type: DataTypes.UUID })
  public groupId: string;

  @Column({ type: DataTypes.ENUM({ values: Object.values(REPORT_SCOPE) }) })
  public reportTo: REPORT_SCOPE;

  @Column({ type: DataTypes.UUID })
  public targetId: string;

  @Column({ type: DataTypes.ENUM({ values: Object.values(CONTENT_TARGET) }) })
  public targetType: CONTENT_TARGET;

  @Column({ type: DataTypes.UUID })
  public targetActorId: string;

  @Column({ type: DataTypes.JSONB })
  public reasonsCount: ReasonCount[];

  @Column({ type: DataTypes.ENUM({ values: Object.values(REPORT_STATUS) }) })
  public status: REPORT_STATUS;

  @Column({ type: DataTypes.UUID })
  public processedBy?: string;

  @Column
  public processedAt?: Date;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @HasMany(() => ReportDetailModel)
  public details?: ReportDetailAttributes[];
}
