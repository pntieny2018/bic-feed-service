import { Injectable } from '@nestjs/common';
import { RedisService } from '@app/redis';
import { GroupSharedDto } from './dto/group-shared.dto';

@Injectable()
export class GroupService {
  public constructor(private _store: RedisService) {}

  public async get(groupId: number): Promise<GroupSharedDto> {
    return await this._store.get<GroupSharedDto>(`GS:${groupId}`);
  }

  public async getMany(groupIds: number[]): Promise<GroupSharedDto[]> {
    const keys = groupIds.map((groupId) => `GS:${groupId}`);
    return await this._store.mget(keys);
  }
}
