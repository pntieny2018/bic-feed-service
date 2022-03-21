import { RedisService } from '@app/redis';
import { Injectable } from '@nestjs/common';
import { UserDataShareDto, UserSharedDto } from './dto';
import { IComment } from '../../database/models/comment.model';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserService {
  public constructor(private _store: RedisService) {}

  /**
   *  Get user info by id
   * @param userId ID of user
   * @returns Promise resolve user info
   */
  public async get(userId: number): Promise<UserSharedDto> {
    return await this._store.get<UserSharedDto>(`US:${userId}`);
  }

  /**
   *  Get users info by ids
   * @param userIds IDs of user
   * @returns Promise resolve users info
   */
  public async getMany(userIds: number[]): Promise<UserSharedDto[]> {
    const keys = [...new Set(userIds)].map((userId) => `US:${userId}`);
    return await this._store.mget(keys);
  }

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
