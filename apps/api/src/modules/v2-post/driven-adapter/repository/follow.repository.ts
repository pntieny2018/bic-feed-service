import { LibFollowRepository, LibPostTagRepository } from '@libs/database/postgres/repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { IFollowRepository } from '../../domain/repositoty-interface';

@Injectable()
export class FollowRepository implements IFollowRepository {
  private _logger = new Logger(FollowRepository.name);

  public constructor(
    @InjectConnection() private readonly _sequelizeConnection: Sequelize,
    private readonly _libPostTagRepo: LibPostTagRepository,
    private readonly _libFollowRepo: LibFollowRepository
  ) {}

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
}
