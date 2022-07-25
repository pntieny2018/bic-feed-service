import { AutoIncrement, Column, CreatedAt, Model, PrimaryKey, Table } from 'sequelize-typescript';

export interface IFollow {
  id: number;
  userId: string;
  groupId: string;
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
  public userId: string;

  @Column
  public groupId: string;

  @CreatedAt
  @Column
  public createdAt: Date;
}
