import { DataTypes, Optional } from 'sequelize';
import { Column, CreatedAt, Model, PrimaryKey, Table, UpdatedAt } from 'sequelize-typescript';

export interface IReportContentAttribute {
  id: string;
  createdBy: string;
  updatedBy: string;
  targetId: string;
  targetType: string;
  authorId: string;
  in: IReportContentGenealogy[];
  reasonType: string;
  reason?: string;
  status?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IReportContentGenealogy {
  communityId: string;
  postId: string;
  commentId?: string;
  parentCommentId?: string;
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
  public targetType: string;

  @Column
  public authorId: string;

  @Column(DataTypes.JSONB)
  public in: IReportContentGenealogy[];

  @Column
  public reasonType: string;

  @Column
  public reason?: string;

  @Column
  public status?: string;

  @CreatedAt
  @Column
  public createdAt: Date;

  @UpdatedAt
  @Column
  public updatedAt?: Date;
}
