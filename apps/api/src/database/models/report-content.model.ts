import { IsUUID } from 'class-validator';
import { DataTypes, Optional } from 'sequelize';
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

import { TargetType } from '../../modules/report-content/contstants';

import {
  IReportContentDetailAttribute,
  ReportContentDetailModel,
} from './report-content-detail.model';

export interface IReportContentAttribute {
  id?: string;
  targetId: string;
  authorId: string;
  targetType: TargetType;
  status?: string;
  details?: IReportContentDetailAttribute[];
  updatedBy?: string;
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
  public targetId: string;

  @Column({
    type: DataTypes.STRING,
  })
  public targetType: TargetType;

  @Column
  public authorId: string;

  @Column
  public status?: string;

  @Column
  public updatedBy?: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @HasMany(() => ReportContentDetailModel)
  public details: ReportContentDetailModel[];
}
