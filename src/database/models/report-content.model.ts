import {
  Column,
  CreatedAt,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { v4 as uuid_v4 } from 'uuid';
import { IsUUID } from 'class-validator';
import { ReportTo, TargetType } from '../../modules/report-content/contstants';

export interface IReportContentAttribute {
  id?: string;
  createdBy: string;
  updatedBy?: string;
  targetId: string;
  targetType: TargetType;
  authorId: string;
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
  @IsUUID()
  @Default(() => uuid_v4())
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
