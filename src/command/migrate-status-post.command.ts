import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { PostModel, PostStatus } from '../database/models/post.model';

@Command({ name: 'post:migrate-status', description: 'Migrate status for all posts' })
export class UpdatePrivacyPostCommand implements CommandRunner {
  public constructor(@InjectModel(PostModel) private _postModel: typeof PostModel) {}

  public async run(): Promise<any> {
    try {
      const posts = await this._postModel.findAll();
      for (const post of posts) {
        let status = PostStatus.PUBLISHED;
        if (post.isDraft) {
          status = PostStatus.DRAFT;
        } else if (post.isProcessing) {
          status = PostStatus.PROCESSING;
        } else if (post.publishedAt) {
          const now = Date.now();
          if (new Date(post.publishedAt).getTime() > now) {
            status = PostStatus.WAITING_SCHEDULE;
          }
        }
        if (!post.status) {
          post.update({ status: status });
        }
      }
      console.log(`Total ${posts.length}. DONE!`);
    } catch (e) {
      console.log(e);
    }
    process.exit();
  }
}
