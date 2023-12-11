import { LibFollowRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

import { IFollowRepository } from '../../domain/repositoty-interface';

@Injectable()
export class FollowRepository implements IFollowRepository {
  public constructor(private readonly _libFollowRepo: LibFollowRepository) {}

  public async bulkCreate(data: { userId: string; groupId: string }[]): Promise<void> {
    await this._libFollowRepo.bulkCreate(data);
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
