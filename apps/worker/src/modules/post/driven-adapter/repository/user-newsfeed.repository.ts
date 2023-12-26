import { LibUserNewsfeedRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

import {
  ContentNewsFeedAttributes,
  IUserNewsfeedRepository,
} from '../../domain/repositoty-interface';

@Injectable()
export class UserNewsfeedRepository implements IUserNewsfeedRepository {
  public constructor(private readonly _libUserNewsfeedRepo: LibUserNewsfeedRepository) {}

  public async attachContentToUserId(
    content: ContentNewsFeedAttributes,
    userId: string
  ): Promise<void> {
    await this._libUserNewsfeedRepo.bulkCreate(
      [
        {
          userId,
          postId: content.id,
          type: content.type,
          publishedAt: content.publishedAt,
          isImportant: content.isImportant,
          isSeenPost: false,
        },
      ],
      { ignoreDuplicates: true }
    );
  }

  public async detachContentIdFromUserId(contentId: string, userId: string): Promise<void> {
    await this._libUserNewsfeedRepo.delete({
      where: {
        postId: contentId,
        userId,
      },
    });
  }

  public async attachContentToUserIds(
    content: ContentNewsFeedAttributes,
    userIds: string[]
  ): Promise<void> {
    await this._libUserNewsfeedRepo.bulkCreate(
      userIds.map((userId) => ({
        userId,
        postId: content.id,
        type: content.type,
        publishedAt: content.publishedAt,
        isImportant: content.isImportant,
        isSeenPost: false,
      })),
      { ignoreDuplicates: true }
    );
  }

  public async detachContentIdFromUserIds(contentId: string, userIds: string[]): Promise<void> {
    await this._libUserNewsfeedRepo.delete({
      where: {
        postId: contentId,
        userId: userIds,
      },
    });
  }

  public async attachContentsToUserId(
    contents: ContentNewsFeedAttributes[],
    userId: string
  ): Promise<void> {
    await this._libUserNewsfeedRepo.bulkCreate(
      contents.map((content) => ({
        userId,
        postId: content.id,
        type: content.type,
        publishedAt: content.publishedAt,
        isImportant: content.isImportant,
        isSeenPost: false,
      })),
      { ignoreDuplicates: true }
    );
  }

  public async detachContentIdsFromUserId(contentIds: string[], userId: string): Promise<void> {
    await this._libUserNewsfeedRepo.delete({
      where: {
        postId: contentIds,
        userId: userId,
      },
    });
  }
}
