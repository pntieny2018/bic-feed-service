import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';
import { Sequelize } from 'sequelize';
import { CommentReactionModel } from '../database/models/comment-reaction.model';
import { PostReactionModel } from '../database/models/post-reaction.model';

@Command({
  name: 'export-reaction',
  description: 'Export reaction count',
})
export class ExportReactionCountDataCommand implements CommandRunner {
  public constructor(
    @InjectModel(CommentReactionModel) private _commentReactionModel: typeof CommentReactionModel,
    @InjectModel(PostReactionModel) private _postReactionModel: typeof PostReactionModel
  ) {}

  public async run(): Promise<any> {
    try {
      console.log('Start export');
      const comments: any = await this._commentReactionModel.findAll({
        attributes: ['reactionName', [Sequelize.literal(`COUNT("comment_id")`), 'total']],
        group: ['reactionName'],
        order: [[Sequelize.literal('total'), 'DESC']],
      });

      const result = [];
      comments.forEach((item) => {
        const data = item.toJSON();
        result.push({
          reactionName: data.reactionName,
          total: data.total,
        });
      });

      const contents: any = await this._postReactionModel.findAll({
        attributes: ['reactionName', [Sequelize.literal(`COUNT("post_id")`), 'total']],
        group: ['reactionName'],
        order: [[Sequelize.literal('total'), 'DESC']],
      });

      contents.forEach((content) => {
        const data = content.toJSON();
        if (result.findIndex((item) => item.reactionName === data.reactionName) === -1) {
          result.push({
            reactionName: data.reactionName,
            total: data.total,
          });
        } else {
          result[result.findIndex((item) => item.reactionName === data.reactionName)].total +=
            data.total;
        }
      });
      const dataSorted = result.sort((a, b) => b.total - a.total);
      console.log('Export data done');
      console.log('=================================');
      console.log(JSON.stringify(dataSorted));
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
