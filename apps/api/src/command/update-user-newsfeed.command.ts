import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { Sequelize } from 'sequelize-typescript';
import { FollowModel } from '../database/models/follow.model';
import { UserNewsFeedModel } from '../database/models/user-newsfeed.model';
import { FeedPublisherService } from '../modules/feed-publisher';
import { PostService } from '../modules/post/post.service';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../modules/v2-user/application';
import { Inject } from '@nestjs/common';

@Command({ name: 'update-newsfeed', description: 'Fix processing status for all posts' })
export class UpdateNewsfeedCommand implements CommandRunner {
  public constructor(
    private _postService: PostService,
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService,
    private _feedPublisherService: FeedPublisherService,
    @InjectModel(UserNewsFeedModel) private _userNewsfeedModel: typeof UserNewsFeedModel,
    @InjectModel(FollowModel) private _followModel: typeof FollowModel
  ) {}

  public async run(): Promise<any> {
    try {
      await this._userNewsfeedModel.destroy({ where: {} });
      const groups = await this._followModel.findAll({
        attributes: [
          'groupId',
          [Sequelize.literal(`string_agg(user_id::character varying, ',')`), 'userId'],
        ],
        group: 'group_id',
      });
      for (const group of groups) {
        // const postIds = await this._postService.findIdsByGroupId([group.groupId]);
        //
        // if (postIds && postIds.length) {
        //   await this._feedPublisherService.attachPostsForUsersNewsFeed(
        //     group.userId.split(','),
        //     postIds
        //   );
        //   console.log(`Updated for group ${group.groupId}, total ${postIds.length} posts`);
        // }
      }

      console.log(`Done.`);
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
