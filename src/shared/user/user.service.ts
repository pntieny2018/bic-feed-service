//FIXME: use @app/redis
import { RedisService } from '../../../libs/redis/src';
import { Injectable } from '@nestjs/common';
import { UserSharedDto } from './dto';
import { PostResponseDto } from 'src/modules/feed/dto/response/post.dto';

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

  public isMemberOfGroups(groupIds: number[], myGroupIds: number[]): boolean {
    return groupIds.some((groupId) => myGroupIds.includes(groupId));
  }

  public async bindUserToPosts(posts: PostResponseDto[]): Promise<void> {
    const userIds = posts.map((post) => post.actor.userId);
    const userSharedDtos = await this.getMany(userIds);
    posts.forEach((post) => {
      post.actor = userSharedDtos.find((u) => u.userId === post.actor.userId);
    });
  }
}
