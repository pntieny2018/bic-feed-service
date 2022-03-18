import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PostGroupModel } from 'src/database/models/post-group.model';
import { IPost, PostModel } from 'src/database/models/post.model';
import { UserNewsFeedModel } from 'src/database/models/user-newsfeed.model';
import { UserDto } from '../auth';
import { GetTimelineDto } from './dto/request';
import { FeedRanking } from './feed.enum';
import { Op } from 'sequelize';
import { FEED_PAGING_DEFAULT_LIMIT } from './feed.constant';
import { MediaModel } from 'src/database/models/media.model';
import { MentionModel } from 'src/database/models/mention.model';
import sequelize from 'sequelize';
import { MediaDto } from '../post/dto/common/media.dto';
import { plainToInstance } from 'class-transformer';
import { UserService } from 'src/shared/user';
import { UserDataShareDto } from 'src/shared/user/dto';
import { PageDto } from 'src/common/dto/pagination/page.dto';
import { FeedPostDto } from './dto/response';
import { IPostReaction, PostReactionModel } from 'src/database/models/post-reaction.model';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);

  public constructor(
    private readonly _userService: UserService,
    @InjectModel(PostModel) private readonly _postModel: typeof PostModel
  ) {}

  public getTimeline(
    userDto: UserDto,
    getTimelineDto: GetTimelineDto
  ): Promise<PageDto<FeedPostDto>> {
    const { userId } = userDto;
    getTimelineDto.limit = Math.min(getTimelineDto.limit, FEED_PAGING_DEFAULT_LIMIT);

    switch (getTimelineDto.ranking) {
      case FeedRanking.IMPORTANT:
        return this._getImportantRankingTimeline(userId, getTimelineDto);
      default:
        throw new HttpException('Ranking algorithm type not match.', HttpStatus.NOT_FOUND);
    }
  }

  private async _getImportantRankingTimeline(
    userId: number,
    getTimelineDto: GetTimelineDto
  ): Promise<PageDto<FeedPostDto>> {
    const { limit, offset, groupId } = getTimelineDto;
    const constraints = FeedService._getIdConstrains(getTimelineDto);

    try {
      const { rows, count } = await this._postModel.findAndCountAll<PostModel>({
        where: {
          ...constraints,
        },
        attributes: {
          include: [
            PostModel.loadReactionsCount(),
            PostModel.loadCommentsCount(),
            PostModel.importantPostsFirstCondition(),
          ],
        },
        include: [
          {
            model: PostGroupModel,
            attributes: ['groupId', 'postId'],
            as: 'belongToGroup',
            where: {
              groupId: groupId,
            },
            required: true,
          },
          {
            model: UserNewsFeedModel,
            attributes: ['userId', 'postId'],
            where: {
              userId: userId,
            },
            required: true,
          },
          {
            model: PostGroupModel,
            as: 'audienceGroup',
            attributes: ['groupId', 'postId'],
            required: true,
          },
          {
            model: MediaModel,
            through: {
              attributes: [],
            },
            required: false,
          },
          {
            model: MentionModel,
            required: false,
          },
          {
            model: PostReactionModel,
            where: {
              createdBy: userId,
            },
            required: false,
          },
        ],
        offset: offset,
        limit: limit,
        order: [
          [sequelize.col('isNowImportant'), 'DESC'],
          ['createdAt', 'DESC'],
        ],
      });

      if (rows.length === 0) {
        throw new Error('No more posts.');
      }
      const posts = await this._convertToFeedPostDto(rows);

      return new PageDto(posts, {
        offset: offset + limit,
        limit: FEED_PAGING_DEFAULT_LIMIT,
      });
    } catch (e) {
      this._logger.error(e, e?.stack);
      if (e?.message === 'No more posts.') {
        throw new HttpException(e.message, HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Can not get timeline.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private static _getIdConstrains(getTimelineDto: GetTimelineDto): object {
    const constraints = {};
    if (getTimelineDto.idGT) {
      constraints['id'] = {
        [Op.gt]: getTimelineDto.idGT,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idGTE) {
      constraints['id'] = {
        [Op.gte]: getTimelineDto.idGTE,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idLT) {
      constraints['id'] = {
        [Op.lt]: getTimelineDto.idLT,
        ...constraints['id'],
      };
    }
    if (getTimelineDto.idLTE) {
      constraints['id'] = {
        [Op.lte]: getTimelineDto.idLTE,
        ...constraints['id'],
      };
    }
    return constraints;
  }

  private async _convertToFeedPostDto(rows: PostModel[]): Promise<FeedPostDto[]> {
    const userIds = FeedService._getUserIds(rows);
    const usersSharedDto = (await this._userService.getMany(userIds)).filter(Boolean);
    const usersDataSharedDto = plainToInstance(UserDataShareDto, usersSharedDto, {
      excludeExtraneousValues: true,
    });

    return rows.map((row: PostModel) => {
      row = row.toJSON();
      const post = new FeedPostDto();

      post.id = row.id;
      post.isDraft = row.isDraft;

      post.actor = usersDataSharedDto.find((u) => u.id === row.createdBy);
      post.createdAt = row.createdAt;

      const mediaTypes = MediaDto.filterMediaType(row.media);
      post.data = {
        content: row.content,
        ...mediaTypes,
      };

      post.audience = {
        groups: (row['audienceGroup'] ?? []).reduce((groupIds: number[], e: PostGroupModel) => {
          groupIds.push(e.groupId);
          return groupIds;
        }, []),
      };

      post.reactionsCount = PostModel.parseAggregatedReaction(row['reactionsCount']);
      post.ownerReactions = row.postReactions.map((e: PostReactionModel): IPostReaction => {
        return {
          id: e.id,
          reactionName: e.reactionName,
          createdAt: e.createdAt,
        };
      });

      post.commentCount = parseInt(row['commentsCount'] ?? 0);

      post.mentions = row.mentions.map((mention) => {
        const mentionedUser = usersDataSharedDto.find((u) => u.id === mention.userId);
        return mentionedUser;
      });

      post.setting = {
        canReact: row.canReact,
        canShare: row.canShare,
        canComment: row.canComment,
        isImportant: row.isImportant,
        importantExpiredAt: row.importantExpiredAt,
      };

      return post;
    });
  }

  private static _getUserIds(rows: IPost[]): number[] {
    const userIds: number[] = [];
    rows.forEach((row) => {
      userIds.push(row.createdBy);
      const mentions = row.mentions ?? [];
      mentions.forEach((mention) => {
        userIds.push(mention.userId);
      });
    });
    return userIds;
  }
}
