import {
  FindUsersSeenContentProps,
  IUserSeenContentRepository,
} from '@api/modules/v2-post/domain/repositoty-interface';
import { LibUserSeenPostRepository } from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserSeenContentRepository implements IUserSeenContentRepository {
  public constructor(private readonly _libUserSeenPostRepository: LibUserSeenPostRepository) {}

  public async findUserIdsSeen(props: FindUsersSeenContentProps): Promise<string[]> {
    const { contentId, limit, offset } = props;
    const usersSeen = await this._libUserSeenPostRepository.findMany({
      where: {
        postId: contentId,
      },
      order: [['createdAt', 'DESC']],
      limit: limit || 20,
      offset: offset || 0,
    });

    return usersSeen.map((userSeen) => userSeen.userId);
  }

  public async getTotalUsersSeen(contentId: string): Promise<number> {
    return this._libUserSeenPostRepository.count({
      where: {
        postId: contentId,
      },
    });
  }
}
