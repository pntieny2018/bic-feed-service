import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PostGroupModel } from 'src/database/models/post-group.model';
import { PostModel } from 'src/database/models/post.model';
import { UserNewsFeedModel } from 'src/database/models/user-newsfeed.model';
import { UserDto } from '../auth';
import { PostService } from '../post/post.service';
import { GetTimelineDto } from './dto/request';
import { FeedDto } from './dto/response';
import { FeedRanking } from './feed.enum';
import { Op } from 'sequelize';
import { FEED_PAGING_DEFAULT_LIMIT } from './feed.constant';
import { MediaModel } from 'src/database/models/media.model';
import { MentionModel } from 'src/database/models/mention.model';
import sequelize from 'sequelize';
import { PostResponseDto } from '../post/dto/responses';
import { MediaDto } from '../post/dto/common/media.dto';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { UserService } from 'src/shared/user';
import { MentionService } from '../mention';
import { UserSharedDto } from 'src/shared/user/dto';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);

  public constructor(
    private readonly _postService: PostService,
    private readonly _userService: UserService,
    private readonly _mentionService: MentionService,
    @InjectModel(PostModel) private readonly _postModel: typeof PostModel
  ) {}

  public getTimeline(userDto: UserDto, getTimelineDto: GetTimelineDto): Promise<FeedDto> {
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
  ): Promise<FeedDto> {
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
        ],
        offset: offset,
        limit: limit,
        order: [
          [sequelize.col('importantFirst'), 'ASC'],
          ['createdAt', 'DESC'],
        ],
      });

      const posts = FeedService._convertToPostResponseDto(rows);
      this._mentionService.bindMentionsToPosts(posts);
      this._userService.bindUserToPosts(posts);

      this._logger.log(rows);
      this._logger.log(count);

      return {
        next: { offset: offset + limit, limit: FEED_PAGING_DEFAULT_LIMIT },
        results: posts,
      };
    } catch (e) {
      this._logger.error(e, e?.stack);
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

  private static _convertToPostResponseDto(rows: PostModel[]): PostResponseDto[] {
    const parseReaction = function (value: string): Record<string, Record<string, number>> {
      if (value && value !== '1=') {
        const rawReactionsCount: string = (value as string).substring(1);
        const [s1, s2] = rawReactionsCount.split('=');
        const reactionsName = s1.split(',');
        const total = s2.split(',');
        const reactionsCount = {};
        reactionsName.forEach((v, i) => (reactionsCount[i] = { [v]: parseInt(total[i]) }));
        return reactionsCount;
      }
      return null;
    };

    return rows.map((row: PostModel) => {
      const post = new PostResponseDto();
      post.id = row.id;

      const mediaTypes = {
        files: [],
        videos: [],
        images: [],
      };
      row.media.forEach((media: MediaModel) => {
        const mediaDto = plainToInstance(MediaDto, instanceToPlain(media), {
          excludeExtraneousValues: true,
        });
        mediaTypes[media.type].push(mediaDto);
      });
      post.data = {
        content: row.content,
        ...mediaTypes,
      };

      post.setting = {
        canReact: row.canReact,
        canShare: row.canShare,
        canComment: row.canComment,
        isImportant: row.isImportant,
        importantExpiredAt: row.importantExpiredAt,
      };

      post.isDraft = row.isDraft;
      post.commentCount = parseInt(row['commentsCount'] ?? 0);
      post.reactionsCount = parseReaction(row['reactionsCount']);

      post.actor.userId = row.createdBy;
      post.mentions = [];
      row.mentions.forEach((mention, index) => {
        post.mentions.push(new UserSharedDto());
        post.mentions[index].userId = mention.userId;
      });

      return post;
    });
  }
}
