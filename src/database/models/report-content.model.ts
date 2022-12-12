import { Optional } from 'sequelize';
import { ReportTo, TargetType } from '../../modules/report-content/contstants';
import { Column, CreatedAt, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript';

export interface IReportContentAttribute {
  id?: string;
  createdBy: string;
  updatedBy?: string;
  targetId: string;
  targetType: TargetType;
  authorId: string;
  communityId: string;
  groupId: string;
  reportTo: ReportTo;
  reasonType: string;
  reason?: string;
  status?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'report_contents',
  paranoid: false,
})
export class ReportContentModel
  extends Model<IReportContentAttribute, Optional<IReportContentAttribute, 'id'>>
  implements IReportContentAttribute
{
  @PrimaryKey
  @Column
  public id: string;

  @Column
  public createdBy: string;

  @Column
  public updatedBy: string;

  @Column
  public targetId: string;

  @Column
  public targetType: TargetType;

  @Column
  public authorId: string;

  @Column
  public communityId: string;

  @Column
  public groupId: string;

  @Column
  public reportTo: ReportTo;

  @Column
  public reasonType: string;

  @Column
  public reason?: string;

  @Column
  public status?: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
