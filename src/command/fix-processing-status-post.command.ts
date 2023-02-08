// import { Command, CommandRunner } from 'nest-commander';
// import { InjectModel } from '@nestjs/sequelize';
// import { PostModel, PostStatus } from '../database/models/post.model';
//
// @Command({ name: 'post:fix-processing-status', description: 'Fix processing status for all posts' })
// export class FixProcessingStatusPostCommand implements CommandRunner {
//   public constructor(@InjectModel(PostModel) private _postModel: typeof PostModel) {}
//
//   public async run(): Promise<any> {
//     try {
//       const posts = await this._postModel.findAll({
//         where: {
//           status: PostStatus.PROCESSING,
//         },
//       });
//       for (const post of posts) {
//         let status = PostStatus.DRAFT;
//         if (post.isDraft === false) {
//           status = PostStatus.PUBLISHED;
//         }
//         await post.update({ status: status });
//       }
//       console.log(`Total ${posts.length}. DONE!`);
//     } catch (e) {
//       console.log(e);
//     }
//     process.exit();
//   }
// }
