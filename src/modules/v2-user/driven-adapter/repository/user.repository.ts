import { RedisService } from '../../../../../libs/redis/src';
import { ArrayHelper } from '../../../../common/helpers';
import { AppHelper } from '../../../../common/helpers/app.helper';
import { UserEntity, UserId } from '../../domain/model/user';
import { IUserRepository } from '../../domain/repositoty-interface/user.repository.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository implements IUserRepository {
  // private readonly _store: RedisService;
  public constructor(private _store: RedisService) {}

  private readonly _prefixRedis = `${AppHelper.getRedisEnv()}SU:`;
  public async findOne(id: UserId): Promise<UserEntity> {
    const group = await this._store.get(`${this._prefixRedis + id.value}`);

    return UserEntity.fromJson(group);
  }

  public async findAllByIds(ids: UserId[]): Promise<UserEntity[]> {
    const keys = [...new Set(ArrayHelper.arrayUnique(ids.map((id) => id.value)))].map(
      (groupId) => `${this._prefixRedis + groupId}`
    );

    const groups = await this._store.mget(keys);
    const result = [];
    for (const group of groups) {
      if (group) {
        result.push(UserEntity.fromJson(group));
      }
    }
    return result;
  }
}
