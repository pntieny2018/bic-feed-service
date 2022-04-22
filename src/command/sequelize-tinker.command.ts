import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../database/models/comment.model';

@Command({ name: 'tinker', description: 'Create shared user and group  data' })
export class SequelizeTinkerCommand implements CommandRunner {
  public constructor(@InjectModel(CommentModel) private _commentModel: typeof CommentModel) {}

  public async run(): Promise<any> {
    try {
      await this._commentModel.destroy({
        where: {
          parentId: 5,
        },
        individualHooks: true,
      });
      const cm = await this._commentModel.findByPk(5);
      await cm.destroy();
    } catch (e) {
      console.log(e);
    }
  }
}
