import { Op, Sequelize } from 'sequelize';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { getDatabaseConfig } from '../config/database';
import { Command, CommandRunner } from 'nest-commander';
import { IPost, PostModel, PostStatus, PostType } from '../database/models/post.model';
import { UserSeenPostModel } from '../database/models/user-seen-post.model';

@Command({ name: 'fix:set-actor-has-seen-post', description: 'Mask actor has seen posts/article' })
export class FixSetActorHasSeenPostCommand implements CommandRunner {
  private _logger = new Logger(FixSetActorHasSeenPostCommand.name);

  public constructor(
    @InjectModel(PostModel)
    private readonly _postModel: typeof PostModel,
    @InjectModel(UserSeenPostModel)
    private _userSeenPostModel: typeof UserSeenPostModel
  ) {}

  public async run(): Promise<any> {
    const posts = await this._getPostsToUpdate();
    if (posts.length != 0) {
      const chunkSize = 100;
      for (let i = 0; i < posts.length; i += chunkSize) {
        const chunk = posts.slice(i, i + chunkSize);
        const dataInsert = chunk.map((post) => ({ postId: post.id, userId: post.createdBy }));
        await this._maskSeen(dataInsert);
        await this._delay(2000);
      }
    }
    this._logger.log(`Done. Total: ${posts.length}`);
    process.exit();
  }

  private async _getPostsToUpdate(): Promise<IPost[]> {
    const { schema } = getDatabaseConfig();
    const userSeenPostTable = this._userSeenPostModel.tableName;
    return this._postModel.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        status: PostStatus.PUBLISHED,
        [Op.or]: [{ type: PostType.POST }, { type: PostType.ARTICLE }],
        [Op.and]: Sequelize.literal(`NOT EXISTS ( 
            SELECT "sp"."post_id" FROM "${schema}"."${userSeenPostTable}" AS "sp"
            WHERE "sp"."post_id" = "PostModel"."id" AND "sp"."user_id" = "PostModel"."created_by"
        )`),
      },
    });
  }

  private async _delay(time: number): Promise<unknown> {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  private async _maskSeen(payload: { postId: string; userId: string }[]): Promise<void> {
    await this._userSeenPostModel.bulkCreate(payload, { ignoreDuplicates: true, hooks: false });
  }
}
