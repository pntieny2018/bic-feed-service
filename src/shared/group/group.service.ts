import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';
import { GroupSharedDto } from './dto';

@Injectable()
export class GroupService {
  public constructor(private _store: RedisService) {}

  public async get(groupId: number): Promise<GroupSharedDto> {
    return await this._store.get<GroupSharedDto>(`GS:${groupId}`);
  }

  public async getMany(groupIds: number[]): Promise<GroupSharedDto[]> {
    const keys = [...new Set(groupIds)].map((groupId) => `GS:${groupId}`);
    if (keys.length) {
      const groups = await this._store.mget(keys);
      const filterNotNull = groups.filter((g) => g !== null);
      return filterNotNull;
    }
    return [];
  }

  /**
   * Check user was join one or more group audience
   * @param groupIds Number[]
   * @param myGroupIds Number[]
   */
  public isMemberOfSomeGroups(groupIds: number[], myGroupIds: number[]): boolean {
    return groupIds.some((groupId) => myGroupIds.includes(groupId));
  }

  /**
   * Check user must join all group audience
   * @param groupIds Number[]
   * @param myGroupIds Number[]
   */
  public isMemberOfGroups(groupIds: number[], myGroupIds: number[]): boolean {
    return groupIds.every((groupId) => myGroupIds.includes(groupId));
  }
}
