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
import { DataTypes, Optional } from 'sequelize';
import { v4 as uuid_v4 } from 'uuid';
import { ReportContentModel } from './report-content.model';
import { ReportTo } from '../../modules/report-content/contstants';

export interface IReportContentDetailAttribute {
  id?: string;
  groupId: string;
  reportTo: ReportTo;
  reportId?: string;
  targetId: string;
  targetType: string;
  reasonType: string;
  reason?: string;
  createdBy: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'report_content_details',
  paranoid: false,
})
export class ReportContentDetailModel
  extends Model<IReportContentDetailAttribute, Optional<IReportContentDetailAttribute, 'id'>>
  implements IReportContentDetailAttribute
{
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

  @Column({
    type: DataTypes.STRING,
  })
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
