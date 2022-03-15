import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { UserSharedDto } from './dto';

@Injectable()
export class UserService {
  public constructor(private _store: RedisService) {}

  public async get(userId: number): Promise<UserSharedDto> {
    return await this._store.get<UserSharedDto>(`US:${userId}`);
  }

  public async getMany(userIds: number[]): Promise<UserSharedDto[]> {
    const keys = userIds.map((userId) => `US:${userId}`);
    return await this._store.mget(keys);
  }

  //TODO: fix this
  public isMemberOfGroups(groupIds: number[], myGroupIds: number[]): boolean {
    return myGroupIds.every((groupId) => groupIds.includes(groupId));
  }
}
