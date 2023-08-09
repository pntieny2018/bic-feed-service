import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import { AllowNull, AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

export type CommentEditedHistoryAttributes = InferAttributes<CommentEditedHistoryModel>;

@Table({
  tableName: 'comment_edited_history',
  timestamps: false,
})
export class CommentEditedHistoryModel extends Model<
  CommentEditedHistoryAttributes,
  InferCreationAttributes<CommentEditedHistoryModel>
> {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @IsUUID()
  @Column
  public commentId: string;

  @AllowNull(false)
  @Column
  public editedAt: Date;

  @AllowNull(true)
  @Column({
    type: DataTypes.JSONB,
  })
  public oldData: any;

  @AllowNull(false)
  @Column({
    type: DataTypes.JSONB,
  })
  public newData: any;
}
