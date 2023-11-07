import { FollowModel } from '@libs/database/postgres/model';
import { LibFollowRepository, LibPostTagRepository } from '@libs/database/postgres/repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { GetUserFollowsGroupIdsProps, IFollowRepository } from '../../domain/repositoty-interface';

@Injectable()
export class FollowRepository implements IFollowRepository {
  private _logger = new Logger(FollowRepository.name);

  public constructor(
    @InjectConnection() private readonly _sequelizeConnection: Sequelize,
    private readonly _libPostTagRepo: LibPostTagRepository,
    private readonly _libFollowRepo: LibFollowRepository
  ) {}

  public async findGroupIdsUserFollowed(userId: string): Promise<string[]> {
    const rows = await this._libFollowRepo.findMany({
      where: {
        userId,
      },
    });

    return rows.map((r) => r.groupId);
  }

  public async bulkCreate(data: { userId: string; groupId: string }[]): Promise<void> {
    if (data.length) {
      await this._libFollowRepo.bulkCreate(data);
    }
  }
  public async deleteByUserIdAndGroupIds(userId: string, groupIds: string[]): Promise<void> {
    await this._libFollowRepo.delete({
      where: {
        userId,
        groupId: groupIds,
      },
    });
  }
  public async findUsersFollowedGroupIds(input: GetUserFollowsGroupIdsProps): Promise<{
    userIds: string[];
    latestFollowId: number;
  }> {
    const { groupIds, notExistInGroupIds, zindex, limit } = input;
    let condition = ` group_id IN (:groupIds) AND zindex > :zindex`;

    if (notExistInGroupIds.length > 0) {
      condition += ` AND NOT EXISTS (
          SELECT user_id FROM ${FollowModel.getTableName()} tb2
          WHERE group_id IN (:notExistInGroupIds)
          AND tb1.user_id = tb2.user_id
        )`;
    }
    const rows = await this._sequelizeConnection.query(
      `SELECT DISTINCT(user_id), zindex
          FROM ${FollowModel.getTableName()} tb1
          WHERE ${condition} ORDER BY zindex ASC limit :limit`,
      {
        replacements: {
          zindex,
          groupIds,
          notExistInGroupIds,
          limit: limit,
        },
      }
    );
    const userIds = rows[0].map((r) => r['user_id']);
    if (userIds.length) {
      return {
        userIds: userIds,
        latestFollowId: rows[0][rows[0].length - 1]['zindex'],
      };
    }
    return {
      userIds,
      latestFollowId: 0,
    };
  }
}
