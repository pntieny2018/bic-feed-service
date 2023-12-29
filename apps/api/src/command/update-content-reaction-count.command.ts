import { getDatabaseConfig } from '@libs/database/postgres/config';
import { PostReactionModel } from '@libs/database/postgres/model';
import { ReactionContentDetailsModel } from '@libs/database/postgres/model/reaction-content-details.model';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner, Option } from 'nest-commander';

interface ICommandOptions {
  rollback: boolean;
}

@Command({
  name: 'reaction:update-content-reaction-count',
  description: 'Update reaction count for contents',
})
export class UpdateContentReactionCountCommand implements CommandRunner {
  private readonly _logger = new Logger(UpdateContentReactionCountCommand.name);

  public constructor(
    @InjectModel(PostReactionModel)
    private _postReactionModel: typeof PostReactionModel,
    @InjectModel(ReactionContentDetailsModel)
    private _reactionContentDetailsModel: typeof ReactionContentDetailsModel
  ) {}

  @Option({
    flags: '-r, --rollback [boolean]',
  })
  public async run(params: string[], options?: ICommandOptions): Promise<any> {
    if (Boolean(options.rollback)) {
      return this.rollBack();
    }

    const databaseConfig = getDatabaseConfig();
    const schema = databaseConfig.schema;

    try {
      this._logger.log('Start update reaction count for contents');

      await this._reactionContentDetailsModel.sequelize.query(`
        INSERT INTO ${schema}."reaction_content_details" ("content_id", "reaction_name", "count")
        SELECT
          "post_id",
          "reaction_name",
          COUNT(*)
        FROM
            ${schema}."posts_reactions" AS "PostReactionsModel"
        GROUP BY "PostReactionsModel"."post_id", "PostReactionsModel"."reaction_name"
      `);

      this._logger.log('Update reaction count successfully');
    } catch (e) {
      this._logger.error(e?.message);
      this._logger.error(JSON.stringify(e?.stack));
    }
    process.exit();
  }

  public async rollBack(): Promise<any> {
    try {
      await this._reactionContentDetailsModel.destroy({
        where: {},
        truncate: true,
      });

      this._logger.log('Rollback successfully');
      process.exit();
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
    }
  }
}
