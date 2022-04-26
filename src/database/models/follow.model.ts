import { AutoIncrement, Column, CreatedAt, Model, PrimaryKey, Table } from 'sequelize-typescript';

export interface IFollow {
  id: number;
  userId: number;
  groupId: number;
  createdAt?: Date;
}

@Table({
  tableName: 'follows',
  timestamps: false,
})
export class FollowModel extends Model<IFollow, Omit<IFollow, 'id'>> {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id: number;

  @Column
  public userId: number;

  @Column
  public groupId: number;

  @CreatedAt
  @Column
  public createdAt: Date;
}
