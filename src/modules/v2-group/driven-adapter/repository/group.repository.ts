import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../../libs/redis/src';
import { ArrayHelper } from '../../../../common/helpers';
import { AppHelper } from '../../../../common/helpers/app.helper';
import { GroupId, GroupEntity } from '../../domain/model/group';
import { IGroupRepository } from '../../domain/repositoty-interface/group.repository.interface';

@Injectable()
export class GroupRepository implements IGroupRepository {
  public constructor(private _store: RedisService) {}
  private readonly _prefixRedis = `${AppHelper.getRedisEnv()}SG:`;
  public async findOne(id: GroupId): Promise<GroupEntity> {
    const group = await this._store.get(`${this._prefixRedis + id.value}`);

    return GroupEntity.fromJson(group);
  }

  public async findAllByIds(ids: GroupId[]): Promise<GroupEntity[]> {
    const keys = [...new Set(ArrayHelper.arrayUnique(ids.map((id) => id.value)))].map(
      (groupId) => `${this._prefixRedis + groupId}`
    );
    const groups = await this._store.mget(keys);
    const result = [];
    for (const group of groups) {
      if (group) {
        result.push(GroupEntity.fromJson(group));
      }
    }
    return result;
  }
}
