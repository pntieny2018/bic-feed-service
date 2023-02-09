import { RedisService } from '../../../../../libs/redis/src';
import { ArrayHelper } from '../../../../common/helpers';
import { AppHelper } from '../../../../common/helpers/app.helper';
import { GroupId } from '../../../postv2/domain/model/group';
import { GroupEntity } from '../../domain/model/group/group.entity';
import { IGroupRepository } from '../../domain/repositoty-interface/group.repository.interface';

export class GroupRepository implements IGroupRepository {
  private readonly _store: RedisService;

  public async findOne(id: GroupId): Promise<GroupEntity> {
    const group = await this._store.get(`${AppHelper.getRedisEnv()}SG:${id.value}`);

    return GroupEntity.fromJson(group);
  }

  public async findAllByIds(ids: GroupId[]): Promise<GroupEntity[]> {
    const keys = [...new Set(ArrayHelper.arrayUnique(ids.map((id) => id.value)))].map(
      (groupId) => `${AppHelper.getRedisEnv()}SG:${groupId}`
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
