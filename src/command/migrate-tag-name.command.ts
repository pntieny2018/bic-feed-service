import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../database/models/comment.model';
import { TagModel } from '../database/models/tag.model';

@Command({ name: 'migrate-tag-name', description: 'Conver tag name to Uppercase' })
export class MigrateTagNameCommand implements CommandRunner {
  public constructor(@InjectModel(TagModel) private _tagModel: typeof TagModel) {}

  public async run(): Promise<any> {
    //this._tagModel.update();
  }
}
