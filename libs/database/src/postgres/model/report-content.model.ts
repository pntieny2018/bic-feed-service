import { CONTENT_TARGET } from '@beincom/constants';
import { IsUUID } from 'class-validator';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
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

import {
  ReportContentDetailAttributes,
  ReportContentDetailModel,
} from './report-content-detail.model';

export enum REPORT_STATUS {
  CREATED = 'CREATED',
  IGNORED = 'IGNORED',
  HIDDEN = 'HID',
}

export type ReportContentAttribute = InferAttributes<ReportContentModel>;

// TODO: Remove this model
@Table({
  tableName: 'report_contents',
  paranoid: false,
})
export class ReportContentModel extends Model<
  ReportContentAttribute,
  InferCreationAttributes<ReportContentModel>
> {
  @PrimaryKey
  @IsUUID()
  @Default(() => uuid_v4())
  @Column
  public id: string;

  @Column
  public targetId: string;

  @Column
  public targetType: CONTENT_TARGET;

  @Column
  public authorId: string;

  @Column
  public status: REPORT_STATUS;

  @Column
  public updatedBy?: string;

  @CreatedAt
  @Column
  public createdAt?: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;

  @HasMany(() => ReportContentDetailModel)
  public details?: ReportContentDetailAttributes[];
}
