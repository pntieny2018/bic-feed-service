import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel } from '../database/models/post.model';
import { PostService } from '../modules/post/post.service';

@Command({ name: 'post:update-privacy', description: 'Update privacy for all posts' })
export class UpdatePrivacyPostCommand implements CommandRunner {
  public constructor(
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    private _postService: PostService
  ) {}

  public async run(): Promise<any> {
    try {
      const posts = await this._postModel.findAll({
        attributes: ['id'],
        raw: true,
      });
      for (const post of posts) {
        console.log('update===', post.id);
        await this._postService.updatePrivacy(post.id);
      }
    } catch (e) {
      console.log(e);
    }
  }
}
