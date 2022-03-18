//FIXME: use @app/redis
import { RedisService } from '../../../libs/redis/src';
import { Injectable } from '@nestjs/common';
import { PostResponseDto } from 'src/modules/feed/dto/response/post.dto';
import { UserDataShareDto, UserSharedDto } from './dto';
import { IComment } from '../../database/models/comment.model';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  public constructor(private _store: RedisService) {}

  public async get(userId: number): Promise<UserSharedDto> {
    return await this._store.get<UserSharedDto>(`US:${userId}`);
  }

  public async getMany(userIds: number[]): Promise<UserSharedDto[]> {
    const keys = [...new Set(userIds)].map((userId) => `US:${userId}`);
    return await this._store.mget(keys);
  }

  public isMemberOfGroups(groupIds: number[], myGroupIds: number[]): boolean {
    return groupIds.some((groupId) => myGroupIds.includes(groupId));
  }

  // public async bindUserToPosts(posts: PostResponseDto[]): Promise<void> {
  //   const userIds = posts.map((post) => post.actor.userId);
  //   const userSharedDtos = await this.getMany(userIds);
  //   posts.forEach((post) => {
  //     post.actor = userSharedDtos.find((u) => u.userId === post.actor.userId);
  //   });
  // }

  public async bindUserToComment(commentsResponse: IComment[]): Promise<void> {
    const actorIds: number[] = [];

    for (const comment of commentsResponse) {
      actorIds.push(comment.createdBy);
      if (comment.child && comment.child.length) {
        for (const cm of comment.child) {
          actorIds.push(cm.createdBy);
        }
      }
    }
    const usersInfo = await this.getMany(actorIds);
    const actorsInfo = plainToInstance(UserDataShareDto, usersInfo, {
      excludeExtraneousValues: true,
    });
    for (const comment of commentsResponse) {
      comment.actor = actorsInfo.find((u) => u.id === comment.createdBy);
      if (comment.child && comment.child.length) {
        for (const cm of comment.child) {
          cm.actor = actorsInfo.find((u) => u.id === cm.createdBy);
        }
      }
    }
  }
}
