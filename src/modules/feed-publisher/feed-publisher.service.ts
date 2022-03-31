import { Op } from 'sequelize';
import { FollowService } from '../follow';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable, Logger } from '@nestjs/common';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { ChangeGroupAudienceDto } from './dto/change-group-audience.dto';
import { GetUserIdsResponseDto } from '../follow/dto/response/get-user-ids-response.dto';

@Injectable()
export class FeedPublisherService {
  private _logger = new Logger(FeedPublisherService.name);
  public constructor(
    private _followService: FollowService,
    @InjectModel(UserNewsFeedModel) private _userNewsFeedModel: typeof UserNewsFeedModel
  ) {}

  public async attachPostsForUserNewsFeed(userId: number, postIds: number[]): Promise<void> {
    this._logger.debug(`[attachPostsForUserNewsFeed]: ${JSON.stringify({ userId, postIds })}`);

    try {
      await this._userNewsFeedModel.bulkCreate(
        postIds.map((postId) => ({
          userId: userId,
          postId: postId,
        }))
      );
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
    }
  }

  /**
   *
   * @param userIds Array<Number>
   * @param postId Array<Number>
   */
  public async attachPostForAnyNewsFeed(userIds: number[], postId: number): Promise<void> {
    this._logger.debug(`[attachPostsForAnyNewsFeed]: ${JSON.stringify({ userIds, postId })}`);

    try {
      await this._userNewsFeedModel.bulkCreate(
        userIds.map((userId) => ({
          userId: userId,
          postId: postId,
        }))
      );
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
    }
  }

  /**
   * Detach post for any NewsFeed
   * @param userIds Array<Number>
   * @param postId Array<Number>
   */
  public async detachPostForAnyNewsFeed(userIds: number[], postId: number): Promise<void> {
    this._logger.debug(`[detachPostsForAnyNewsFeed]: ${JSON.stringify({ userIds, postId })}`);

    try {
      await this._userNewsFeedModel.destroy({
        where: {
          userId: {
            [Op.in]: userIds,
          },
          postId: postId,
        },
      });
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
    }
  }

  public async detachPostForAllNewsFeed(postId: number): Promise<void> {
    try {
      await this._userNewsFeedModel.destroy({
        where: {
          postId: postId,
        },
      });
    } catch (ex) {
      this._logger.debug(ex, ex.stack);
    }
  }

  public async fanoutOnWrite(
    postId: number,
    changeGroupAudienceDto: ChangeGroupAudienceDto
  ): Promise<void> {
    this._logger.debug(`[writeFanout]: ${JSON.stringify({ postId, changeGroupAudienceDto })}`);
    let followedAt = null;

    while (true) {
      const groupAttachedIds = changeGroupAudienceDto.attached;
      const groupDetachedIds = changeGroupAudienceDto.detached;
      let userFollows: GetUserIdsResponseDto;
      if (groupAttachedIds.length) {
        userFollows = await this._followService.getUserFollows(groupAttachedIds, followedAt);
        await this.attachPostForAnyNewsFeed(userFollows.data.userIds, postId);
      }

      if (groupDetachedIds.length) {
        userFollows = await this._followService.getUserIdsWhenUpdatedGroupAudience(
          {
            currentGroupIds: changeGroupAudienceDto.current,
            detachedGroupIds: changeGroupAudienceDto.detached,
          },
          followedAt
        );
        await this.detachPostForAnyNewsFeed(userFollows.data.userIds, postId);
      }
      followedAt = userFollows.followedAt;

      if (!followedAt) {
        break;
      }
    }
  }
}
