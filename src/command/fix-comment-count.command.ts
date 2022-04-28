import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../database/models/comment.model';

@Command({ name: 'fix:comment:count', description: 'Fix comment count' })
export class FixCommentCountCommand implements CommandRunner {
  public constructor(@InjectModel(CommentModel) private _commentModel: typeof CommentModel) {}

  public async run(): Promise<any> {
    let offset = 0;
    const limit = 1;
    while (true) {
      try {
        const comments = await this._commentModel.findAll({
          where: {
            parentId: 0,
          },
          limit: limit,
          offset: offset,
          order: [['createdAt', 'DESC']],
        });

        if (!comments || comments.length === 0) {
          break;
        }
        const total = await this._commentModel.count({
          where: {
            parentId: comments[0].id,
          },
        });

        await comments[0].update({
          totalReply: total,
        });
        console.log(`update comment count of ${comments[0].id} : ${total}`);
        offset += limit;
      } catch (e) {}
    }
  }
}
