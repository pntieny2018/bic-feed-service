import { Op } from 'sequelize';
import sequelize from 'sequelize';
import { UserDto } from '../auth';
import { MediaService } from '../media';
import { FeedRanking } from './feed.enum';
import { PageDto } from '../../common/dto';
import { FeedPostDto } from './dto/response';
import { GetTimelineDto } from './dto/request';
import { UserService } from '../../shared/user';
import { InjectModel } from '@nestjs/sequelize';
import { PAGING_DEFAULT_LIMIT } from '../../common/constants';
import { MediaModel } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { IPost, PostModel } from '../../database/models/post.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IPostReaction, PostReactionModel } from '../../database/models/post-reaction.model';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);

  public constructor(
    private readonly _userService: UserService,
    @InjectModel(PostModel) private readonly _postModel: typeof PostModel
  ) {}

  /**
   * Get timeline
   * @param userDto UserDto
   * @param getTimelineDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  public getTimeline(
    userDto: UserDto,
    getTimelineDto: GetTimelineDto
  ): Promise<PageDto<FeedPostDto>> {
    const { id } = userDto;

    switch (getTimelineDto.ranking) {
      case FeedRanking.IMPORTANT:
        return this._getImportantRankingTimeline(id, getTimelineDto);
      default:
        throw new HttpException('Ranking algorithm type not match.', HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Get important ranking timeline
   * @param userId number
   * @param getTimelineDto GetTimelineDto
   * @returns Promise resolve PageDto
   * @throws HttpException
   */
  private async _getImportantRankingTimeline(
    userId: number,
    getTimelineDto: GetTimelineDto
  ): Promise<PageDto<FeedPostDto>> {
    const { limit, offset, groupId } = getTimelineDto;
    const constraints = FeedService._getIdConstrains(getTimelineDto);
    try {
      const { rows } = await this._postModel.findAndCountAll<PostModel>({
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
            as: 'ownerReactions',
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

      const posts = await this._convertToFeedPostDto(rows);

      return new PageDto(posts, {
        offset: offset + limit,
        limit: PAGING_DEFAULT_LIMIT,
      });
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not get timeline.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get id constrains
   * @param getTimelineDto GetTimelineDto
   * @returns object
   */
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

  /**
   * Convert to FeedPostDto
   * @param rows PostModel[]
   * @returns Promise resolve FeedPostDto[]
   */
  private async _convertToFeedPostDto(rows: PostModel[]): Promise<FeedPostDto[]> {
    const userIds = FeedService._getUserIds(rows);
    const userSharedDtos = (await this._userService.getMany(userIds)).filter(Boolean);
    return rows.map((row: PostModel) => {
      row = row.toJSON();
      const post = new FeedPostDto();

      post.id = row.id;
      post.isDraft = row.isDraft;

      post.actor = userSharedDtos.find((u) => u.id === row.createdBy);

      post.createdAt = row.createdAt;

      const mediaTypes = MediaService.filterMediaType(row.media);
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
      post.ownerReactions = (row['ownerReactions'] ?? []).map(
        (e: PostReactionModel): IPostReaction => {
          return {
            id: e.id,
            reactionName: e.reactionName,
            createdAt: e.createdAt,
          };
        }
      );

      //post.commentsCount = parseInt(row['commentsCount'] ?? 0);

      post.mentions = row.mentions.map((mention) => {
        const mentionedUser = userSharedDtos.find((u) => u.id === mention.userId);
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

  /**
   * Get userIds
   * @param rows IPost[]
   * @returns number[]
   */
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

  public async getNewsFeed() {}
}
