import { AutoIncrement, Column, CreatedAt, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { getDatabaseConfig } from '@libs/database/postgres/config';

export interface IFollow {
  zindex: number;
  userId: string;
  groupId: string;
  createdAt?: Date;
}

@Table({
  tableName: 'follows',
  timestamps: false,
})
export class FollowModel extends Model<IFollow, IFollow> implements IFollow {
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

  public static async getValidUserIds(userIds: string[], groupIds: string[]): Promise<string[]> {
    const { schema } = getDatabaseConfig();
    if (!userIds.length) {
      return [];
    }
    const rows = await this.sequelize.query(
      ` SELECT DISTINCT(user_id), zindex
        FROM ${schema}.${FollowModel.tableName} tb1
        WHERE group_id IN (:groupIds) AND user_id IN (:userIds)`,
      {
        replacements: {
          groupIds,
          userIds,
        },
      }
    );
    if (!rows) {
      return [];
    }
    return rows[0].map((r) => r['user_id']);
  }
}
