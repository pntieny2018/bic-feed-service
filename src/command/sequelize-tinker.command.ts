import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { CommentReactionModel } from '../database/models/comment-reaction.model';
import { FeedPublisherService } from '../modules/feed-publisher';
import { getDatabaseConfig } from '../config/database';
import { MentionModel } from '../database/models/mention.model';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { FollowModel } from '../database/models/follow.model';
import { CommentModel } from '../database/models/comment.model';

@Command({ name: 'tinker', description: 'Create shared user and group  data' })
export class SequelizeTinkerCommand implements CommandRunner {
  public constructor(@InjectModel(CommentModel) private _commentModel: typeof CommentModel) {}

  public async run(): Promise<any> {
    const { schema } = getDatabaseConfig();
    const parentId = 1;
    const groupIds = [1];
    const limit = 10;
    try {
      const recentComments = await this._commentModel.findAll({
        include: [
          {
            model: MentionModel,
            required: true,
          },
        ],
        where: {
          parentId: parentId,
          id: {
            [Op.in]: Sequelize.literal(
              `( select user_id from ${schema}.${
                FollowModel.tableName
              } where group_id in (${groupIds.join(',')}) )`
            ),
          },
        },
        order: [['createdAt', 'DESC']],
        limit,
      });
    } catch (e) {
      console.log(e);
    }
  }
}
