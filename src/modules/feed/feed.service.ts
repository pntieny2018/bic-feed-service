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
import { FindOptions } from 'sequelize';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class FeedService {
  private readonly _logger = new Logger(FeedService.name);

  public constructor(
    private readonly _postService: PostService,
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
    const { offset, limit, groupId } = getTimelineDto;

    try {
      const findOptsInclude: FindOptions = {
        include: [
          {
            model: PostGroupModel,
            attributes: [],
            where: {
              groupId: groupId,
            },
            required: true,
          },
          {
            model: UserNewsFeedModel,
            attributes: [],
            where: {
              userId: userId,
            },
            required: true,
          },
        ],
      };

      const importantPostIds = await this._getImportantPostIds(getTimelineDto, findOptsInclude);
      const chosenImportantPostIds = importantPostIds.slice(offset, offset + limit);

      const [normalPostsOffset, normalPostsLimit] = FeedService._newPaginationOpts(
        offset,
        limit,
        importantPostIds.length
      );
      let normalPostIds: number[] = [];
      if (normalPostsLimit > 0) {
        normalPostIds = await this._getNormalPostIds(
          {
            offset: normalPostsOffset,
            limit: normalPostsLimit,
            groupId: groupId,
          },
          findOptsInclude
        );
      }

      //FIXME: delete here
      console.log(normalPostIds);

      const postIds = [...chosenImportantPostIds, ...normalPostIds];
      //FIXME: use postService.
      const posts = await Promise.all(
        // postIds.map((postId: number) => this._postService.getPost(postId))

        // simulate _postService.getPost
        postIds.map((postId: number) =>
          this._postModel.findOne<PostModel>({
            where: {
              id: postId,
            },
          })
        )
      );

      const rawFeedDto = {
        next: {
          offset: offset + limit,
          limit: FEED_PAGING_DEFAULT_LIMIT,
        },
        results: posts,
      };
      const feedDto = plainToInstance(FeedDto, rawFeedDto);
      return feedDto;
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw new HttpException('Can not get timeline.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async _getImportantPostIds(
    getTimelineDto: GetTimelineDto,
    { include }: FindOptions
  ): Promise<number[]> {
    const { offset, limit } = getTimelineDto;
    const now = new Date();
    const importantPosts = await this._postModel.findAll<PostModel>({
      attributes: ['id', 'createdAt'],
      include: include,
      where: {
        importantExpiredAt: {
          [Op.gt]: now,
        },
      },
      order: [['createdAt', 'DESC']],
      limit: offset + limit,
    });
    const importantPostIds = importantPosts.map((post: PostModel) => post.id);
    return importantPostIds;
  }

  private static _newPaginationOpts(offset: number, limit: number, queriedNum: number): number[] {
    let newOffset: number;
    let newLimit: number;
    if (queriedNum < offset) {
      newOffset = offset - queriedNum;
      newLimit = limit;
    } else {
      newOffset = 0;
      newLimit = limit - (queriedNum - offset);
    }
    return [newOffset, newLimit];
  }

  private async _getNormalPostIds(
    getTimelineDto: GetTimelineDto,
    { include }: FindOptions
  ): Promise<number[]> {
    const { offset, limit } = getTimelineDto;
    const now = new Date();
    const normalPosts = await this._postModel.findAll<PostModel>({
      attributes: ['id', 'createdAt'],
      include: include,
      where: {
        importantExpiredAt: {
          [Op.or]: {
            [Op.lte]: now,
            [Op.is]: null,
          },
        },
      },
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
    });
    const normalPostIds = normalPosts.map((post: PostModel) => post.id);
    return normalPostIds;
  }
}
