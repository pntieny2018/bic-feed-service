import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { PostModel } from '../database/models/post.model';
import { Inject } from '@nestjs/common';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../modules/v2-user/application';
import { Sequelize } from 'sequelize';

@Command({
  name: 'export-user-content',
  description: 'Export user create content and count number content by type',
})
export class ExportUserContentDataCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,

    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService
  ) {}

  public async run(): Promise<any> {
    try {
      console.log('Start export user content data');
      await this._exportUserContentData();
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }

  private async _exportUserContentData(): Promise<void> {
    let count = 0;
    const data = [];

    const userIds = (
      await this._postModel.findAll({
        attributes: ['createdBy'],
        group: ['createdBy'],
      })
    ).map((item) => item.createdBy);

    // count number of post, article, series
    const postCount = await this._postModel.findAll({
      attributes: [
        'createdBy',
        [
          Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN type = 'POST' THEN 1 END")),
          'post_count',
        ],
        [
          Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN type = 'ARTICLE' THEN 1 END")),
          'article_count',
        ],
        [
          Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN type = 'SERIES' THEN 1 END")),
          'series_count',
        ],
      ],
      group: ['createdBy'],
    });

    for (const userId of userIds) {
      count++;
      console.log(`Exporting ${count}/${userIds.length}`);
      if (!userId) continue;
      const user = await this._userAppService.findOne(userId);

      data.push({
        userInfo: user,
        content: postCount.find((item) => item.createdBy === userId),
      });
    }

    console.log('Export user content data done');
    console.log('=================================');
    console.log(JSON.stringify(data));
  }
}
