import { InferAttributes, InferCreationAttributes } from 'sequelize';
import { AutoIncrement, Column, CreatedAt, Model, PrimaryKey, Table } from 'sequelize-typescript';

export type FollowAttributes = InferAttributes<FollowModel>;

@Table({
  tableName: 'follows',
  timestamps: false,
})
export class FollowModel extends Model<FollowAttributes, InferCreationAttributes<FollowModel>> {
  @AutoIncrement
  @Column
  public zindex: number;

  @PrimaryKey
  @Column
  public userId: string;

  @PrimaryKey
  @Column
  public groupId: string;

  @CreatedAt
  @Column
  public createdAt: Date;
}
