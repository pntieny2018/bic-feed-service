import { CONTENT_STATUS } from '@beincom/constants';
import { PostModel, PostTagModel, TagModel } from '@libs/database/postgres/model';
import { InjectModel } from '@nestjs/sequelize';
import { Command, CommandRunner } from 'nest-commander';

@Command({ name: 'tag:update-total-used', description: 'Update total used for all tags' })
export class UpdateTagTotalUsedCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostTagModel) private _postTagModel: typeof PostTagModel,
    @InjectModel(TagModel) private _tagModel: typeof TagModel
  ) {}

  public async run(): Promise<any> {
    try {
      const tagPosts = await this._postTagModel.findAll({
        include: [
          {
            model: PostModel,
            as: 'post',
            required: false,
          },
        ],
      });
      const totalUsedMapping = tagPosts.reduce((result, current) => {
        if (current.post.status === CONTENT_STATUS.PUBLISHED) {
          if (result[current.tagId]) {
            result[current.tagId] += 1;
          } else {
            result[current.tagId] = 1;
          }
        }
        return result;
      }, {});
      const tags = await this._tagModel.findAll();
      for (const tag of tags) {
        if (totalUsedMapping[tag.id]) {
          await tag.update({ totalUsed: totalUsedMapping[tag.id] });
        } else {
          await tag.update({ totalUsed: 0 });
        }
      }
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
