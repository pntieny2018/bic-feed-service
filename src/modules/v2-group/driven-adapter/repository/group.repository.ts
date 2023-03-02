import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../../libs/redis/src';
import { ArrayHelper } from '../../../../common/helpers';
import { AppHelper } from '../../../../common/helpers/app.helper';
import { GroupEntity } from '../../domain/model/group';
import { IGroupRepository } from '../../domain/repositoty-interface/group.repository.interface';
import { GROUP_PRIVACY } from '../../data-type';

type GroupDataInCache = {
  id: string;
  name: string;
  icon: string;
  privacy: GROUP_PRIVACY;
  communityId: string;
  rootGroupId: string;
  isCommunity: boolean;
  child: {
    open: string[];
    closed: string[];
    private: string[];
    secret: string[];
  };
};

@Injectable()
export class GroupRepository implements IGroupRepository {
  public constructor(private _store: RedisService) {}

  private readonly _prefixRedis = `${AppHelper.getRedisEnv()}SG:`;

  public async findOne(groupId: string): Promise<GroupEntity> {
    const group = await this._store.get<GroupDataInCache>(`${this._prefixRedis}groupId`);
    if (group === null) return null;
    return new GroupEntity(group);
  }

  public async findAllByIds(groupIds: string[]): Promise<GroupEntity[]> {
    const keys = [...new Set(ArrayHelper.arrayUnique(groupIds.map((id) => id)))].map(
      (groupId) => `${this._prefixRedis + groupId}`
    );
    const groups = await this._store.mget(keys);
    const result = [];
    for (const group of groups) {
      if (group) {
        result.push(new GroupEntity(group));
      }
    }
    return result;
  }
}
