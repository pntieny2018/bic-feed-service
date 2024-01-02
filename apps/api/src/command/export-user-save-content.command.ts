import { UserSavePostModel } from '@libs/database/postgres/model';
import { IUserService, USER_SERVICE_TOKEN } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import moment from 'moment';
import { Command } from 'nest-commander';
import { Op } from 'sequelize';

@Command({
  name: 'export-user-save-content',
  description: 'Export user save content',
})
export class ExportUserSaveContentCommand {
  public constructor(
    @InjectModel(UserSavePostModel) private _userSavePostModel: typeof UserSavePostModel,
    @Inject(USER_SERVICE_TOKEN)
    private readonly _userService: IUserService
  ) {}

  public async run(): Promise<any> {
    try {
      console.log('Start export');
      await this._exportUserSaveContent();
      console.log('Export data done');
      console.log('=================================');
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }

  private async _exportUserSaveContent(): Promise<void> {
    const limit = 100;
    let offset = 0;
    const dayAgo = 30;
    const data = [];

    while (true) {
      const userSavePosts = await this._userSavePostModel.findAll({
        limit,
        offset,
        where: {
          createdAt: {
            [Op.gte]: moment().subtract(dayAgo, 'days').toDate(),
          },
        },
      });
      if (!userSavePosts.length) {
        break;
      }
      offset += limit;

      const userIds = userSavePosts.map((item) => item.userId);
      const users = await this._userService.findAllByIds(userIds);
      const userMap = users.reduce((acc, user) => {
        acc[user.id] = user.username;
        return acc;
      }, {});

      for (const userSavePost of userSavePosts) {
        data.push({
          username: userMap[userSavePost.userId],
          created_at: userSavePost.createdAt,
        });
      }
    }

    console.log(JSON.stringify(data));
  }
}
