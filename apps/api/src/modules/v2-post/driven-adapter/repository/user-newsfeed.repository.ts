import { LibUserNewsfeedRepository } from '@libs/database/postgres/repository';
import { Injectable, Logger } from '@nestjs/common';
import { IUserNewsfeedRepository } from '../../domain/repositoty-interface';

@Injectable()
export class UserNewsfeedRepository implements IUserNewsfeedRepository {
  private _logger = new Logger(UserNewsfeedRepository.name);

  public constructor(private readonly _libUserNewsfeedRepo: LibUserNewsfeedRepository) {}

  public async attachContentIdToUserId(contentId: string, userId: string): Promise<void> {
    await this._libUserNewsfeedRepo.bulkCreate(
      [
        {
          userId,
          postId: contentId,
          isSeenPost: false,
        },
      ],
      { ignoreDuplicates: true }
    );
  }
  public async hasPublishedContentIdToUserId(contentId: string, userId: string): Promise<boolean> {
    const data = await this._libUserNewsfeedRepo.first({
      where: {
        userId,
        postId: contentId,
      },
    });
    return !!data;
  }
  public async detachContentIdFromUserId(contentId: string, userId: string): Promise<void> {
    await this._libUserNewsfeedRepo.delete({
      where: {
        postId: contentId,
        userId,
      },
    });
  }
}
