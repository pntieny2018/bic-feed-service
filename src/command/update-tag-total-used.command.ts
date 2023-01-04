import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../database/models/post.model';
import { PostTagModel } from '../database/models/post-tag.model';
import { TagModel } from '../database/models/tag.model';

@Command({ name: 'tag:update-total-used', description: 'Update total used for all tags' })
export class UpdateTagTotalUsedCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
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
        if (!current.post.isDraft) {
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
