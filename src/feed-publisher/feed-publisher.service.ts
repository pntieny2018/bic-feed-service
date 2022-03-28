import { Op } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable, Logger } from '@nestjs/common';
import { UserNewsFeedModel } from '../database/models/user-newsfeed.model';

@Injectable()
export class FeedPublisherService {
  private _logger = new Logger(FeedPublisherService.name);
  public constructor(
    @InjectModel(UserNewsFeedModel) private _userNewsFeedModel: typeof UserNewsFeedModel
  ) {}

  public async deletePostsFromAnyNewsFeed(postIds: number[]): Promise<void> {
    this._logger.debug(`delete posts from any newsfeed: ${postIds}`);
    await this._userNewsFeedModel.destroy({
      where: {
        postId: {
          [Op.in]: postIds,
        },
      },
    });
  }
}
