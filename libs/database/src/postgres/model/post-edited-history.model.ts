import { IsUUID } from 'class-validator';
import { DataTypes, InferAttributes, InferCreationAttributes } from 'sequelize';
import { AllowNull, AutoIncrement, Column, Model, PrimaryKey, Table } from 'sequelize-typescript';

export type PostEditedHistoryAttributes = InferAttributes<PostEditedHistoryModel>;

@Table({
  tableName: 'post_edited_history',
  timestamps: false,
})
export class PostEditedHistoryModel extends Model<
  PostEditedHistoryAttributes,
  InferCreationAttributes<PostEditedHistoryModel>
> {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @IsUUID()
  @Column
  public postId: string;

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
