import { ContentEntity } from '@api/modules/v2-post/domain/model/content';
import { ORDER } from '@beincom/constants';
import { FindOptions } from '@libs/database/postgres';
import {
  createCursor,
  CursorPaginationResult,
  getLimitFromAfter,
} from '@libs/database/postgres/common';
import {
  PostGroupModel,
  UserMarkReadPostModel,
  UserNewsFeedModel,
  UserSavePostModel,
} from '@libs/database/postgres/model';
import {
  LibContentRepository,
  LibUserNewsfeedRepository,
} from '@libs/database/postgres/repository';
import { Injectable } from '@nestjs/common';

import {
  GetContentIdsCursorPaginationByUserIdProps,
  GetImportantContentIdsCursorPaginationByUserIdProps,
  IUserNewsfeedRepository,
} from '../../domain/repositoty-interface';

@Injectable()
export class UserNewsfeedRepository implements IUserNewsfeedRepository {
  public constructor(
    private readonly _libUserNewsfeedRepo: LibUserNewsfeedRepository,
    private readonly _libContentRepo: LibContentRepository
  ) {}

  public async attachContentToUserId(contentEntity: ContentEntity, userId: string): Promise<void> {
    await this._libUserNewsfeedRepo.bulkCreate(
      [
        {
          userId,
          postId: contentEntity.getId(),
          type: contentEntity.getType(),
          publishedAt: contentEntity.getPublishedAt(),
          isImportant: contentEntity.isImportant(),
          createdBy: contentEntity.getCreatedBy(),
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

  public async detachContentIdFromAllUsers(contentId: string): Promise<void> {
    await this._libUserNewsfeedRepo.delete({
      where: {
        postId: contentId,
      },
    });
  }

  public async getContentIdsCursorPaginationByUserId(
    getNewsfeedPaginationProps: GetContentIdsCursorPaginationByUserIdProps
  ): Promise<CursorPaginationResult<string>> {
    const { userId, after, limit, isSavedBy, type, createdBy, isImportant } =
      getNewsfeedPaginationProps;
    const findOption: FindOptions<UserNewsFeedModel> = {
      select: ['userId', 'postId', 'publishedAt'],
      where: { userId },
      whereRaw: this._filterUnArchivedContent(),
    };

    let sortColumns: any = ['publishedAt'];

    if (isImportant) {
      findOption.where = {
        ...findOption.where,
        isImportant,
      };
      findOption.selectRaw = [this._libContentRepo.loadMarkReadPost(userId, 'markedReadPost')];
      sortColumns = ['markedReadPost', ORDER.ASC];
    }

    if (isSavedBy) {
      findOption.include = [
        {
          model: UserSavePostModel,
          as: 'userSavePosts',
          required: true,
          where: { userId: isSavedBy },
        },
      ];
      sortColumns = [{ model: UserSavePostModel, as: 'userSavePosts', field: 'createdAt' }];
    }

    if (createdBy) {
      findOption.where = {
        ...findOption.where,
        createdBy,
      };
    }

    if (type) {
      findOption.where = {
        ...findOption.where,
        type,
      };
    }

    const { rows, meta } = await this._libUserNewsfeedRepo.cursorPaginate(findOption, {
      limit,
      after,
      order: ORDER.DESC,
      sortColumns,
    });

    return {
      rows: rows.map((row) => row.postId),
      meta,
    };
  }

  public async getImportantContentIdsCursorPaginationByUserId(
    getImportantContentIdsCursorPaginationByUserIdProps: GetImportantContentIdsCursorPaginationByUserIdProps
  ): Promise<CursorPaginationResult<string>> {
    const { userId, type, after, limit } = getImportantContentIdsCursorPaginationByUserIdProps;
    const offset = getLimitFromAfter(after);

    const findOption: FindOptions<UserNewsFeedModel> = {
      select: ['postId'],
      selectRaw: [
        [
          `(
        COALESCE((SELECT true FROM ${UserMarkReadPostModel.getTableName()} as r
          WHERE r.post_id = "UserNewsFeedModel".post_id AND r.user_id = ${UserMarkReadPostModel.sequelize.escape(
            userId
          )}), false)
               )`,
          'markedReadPost',
        ],
      ],
      where: { userId, isImportant: true },
      whereRaw: this._filterUnArchivedContent(),
      limit: limit + 1,
      offset,
      order: [
        ['markedReadPost', ORDER.ASC],
        ['publishedAt', ORDER.DESC],
      ],
    };

    if (type) {
      findOption.where = {
        ...findOption.where,
        type,
      };
    }

    const rows = await this._libUserNewsfeedRepo.findMany(findOption);

    const hasMore = rows.length > limit;

    if (hasMore) {
      rows.pop();
    }

    return {
      rows: rows.map((row) => row.postId),
      meta: {
        hasNextPage: hasMore,
        endCursor: rows.length > 0 ? createCursor({ offset: limit + offset }) : undefined,
      },
    };
  }

  private _filterUnArchivedContent(): string {
    return `EXISTS (
          SELECT g.group_id FROM ${PostGroupModel.getTableName()} g
            WHERE g.post_id = "UserNewsFeedModel".post_id  AND g.is_archived = false
        )`;
  }
}
