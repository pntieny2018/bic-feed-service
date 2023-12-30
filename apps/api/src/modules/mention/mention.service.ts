import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { Inject, Injectable } from '@nestjs/common';

import { UserMentionDto } from './dto';

@Injectable()
export class MentionService {
  public constructor(
    @Inject(USER_SERVICE_TOKEN)
    private _userAppService: IUserService
  ) {}

  /**
   * Resolve mentions by id
   * @param userIds number[]
   * @returns Promise resolve UserSharedDto[]
   */
  public async resolve(userIds: string[]): Promise<UserDto[]> {
    if (!userIds.length) {
      return [];
    }
    const users = await this._userAppService.findAllByIds(userIds);
    return users;
  }

  /**
   * Bind mention to comment
   * @param commentsResponse any[]
   */
  public async bindToComment(commentsResponse: any[]): Promise<void> {
    const userIds: string[] = this._getUserIdsFromComments(commentsResponse);
    const usersInfo = await this.resolve(userIds);
    const convert = (usersData: any[]): UserMentionDto => {
      const replacement = {};
      usersData
        .filter((i) => i !== null && i !== undefined)
        .forEach((user) => {
          replacement[user.username] = user;
        });
      return replacement;
    };
    for (const comment of commentsResponse) {
      if (comment?.parent) {
        comment.parent.mentions = convert(
          comment.parent.mentions.map((userId) => usersInfo.find((u) => u.id === userId))
        );
      }
      // if (comment.mentions && comment.mentions.length) {
      comment.mentions = convert(
        comment.mentions.map((userId) => usersInfo.find((u) => u.id === userId))
      );
      // }
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child?.list) {
          cm.mentions = convert(
            cm.mentions.map((userId) => usersInfo.find((u) => u.id === userId))
          );
        }
      }
    }
  }

  private _getUserIdsFromComments(commentsResponse: any[]): string[] {
    const userIds: string[] = [];
    for (const comment of commentsResponse) {
      if (comment?.parent?.mentions.length) {
        userIds.push(...comment.parent.mentions);
      }
      if (comment.mentions && comment.mentions.length) {
        userIds.push(...comment.mentions);
      }
      if (comment.child?.list && comment.child?.list.length) {
        for (const cm of comment.child.list) {
          if (cm.mentions?.length) {
            userIds.push(...cm.mentions);
          }
        }
      }
    }
    return userIds;
  }

  /**
   * Bind mention to post
   * @param posts any[]
   */
  public async bindToPosts(posts: any[]): Promise<void> {
    const userIds: string[] = [];

    for (const post of posts) {
      if (post.mentions && post.mentions.length) {
        userIds.push(...post.mentions);
      }
    }

    const usersInfo = await this.resolve(userIds);
    for (const post of posts) {
      if (post.mentions?.length) {
        const mentions = [];
        post.mentions.forEach((userId) => {
          const user = usersInfo.find((u) => u.id === userId);
          if (user) {
            mentions.push(user);
          }
        });
        post.mentions = mentions.reduce((obj, cur) => ({ ...obj, [cur.username]: cur }), {});
      }
    }
  }
}
