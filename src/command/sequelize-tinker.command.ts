import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../database/models/comment.model';
import { MediaModel } from '../database/models/media.model';
import { MentionModel } from '../database/models/mention.model';
import { plainToInstance } from 'class-transformer';
import { CommentResponseDto } from '../modules/comment/dto/response/comment.response.dto';
import { MentionService } from '../modules/mention';
import { CommentReactionModel } from '../database/models/comment-reaction.model';
import { CommentService } from '../modules/comment';

@Command({ name: 'tinker', description: 'Create shared user and group  data' })
export class SequelizeTinkerCommand implements CommandRunner {
  public constructor(
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _mentionService: MentionService,
    private _commentService: CommentService
  ) {}

  public async run(): Promise<any> {
    // await (await this._commentModel.findByPk(7)).destroy();
    // await this._commentModel.create({
    //   postId: 1,
    //   parentId: 2,
    //   content: 'hello',
    //   createdBy: 1,
    // });
    // try {
    //   const rows = await this._commentModel.findAndCountAll({
    //     where: {
    //       // postId: 1,
    //       id: 57,
    //     },
    //     attributes: {
    //       include: [CommentModel.loadReactionsCount()],
    //     },
    //     include: [
    //       {
    //         model: MediaModel,
    //         through: {
    //           attributes: [],
    //         },
    //         required: false,
    //       },
    //       {
    //         model: MentionModel,
    //         as: 'mentions',
    //       },
    //       {
    //         model: CommentModel,
    //         as: 'child',
    //         limit: 25,
    //         required: false,
    //         attributes: {
    //           include: [CommentModel.loadReactionsCount()],
    //         },
    //         include: [
    //           {
    //             model: MediaModel,
    //             through: {
    //               attributes: [],
    //             },
    //             required: false,
    //           },
    //           {
    //             model: MentionModel,
    //             as: 'mentions',
    //             required: false,
    //           },
    //           {
    //             model: CommentReactionModel,
    //             as: 'ownerReactions',
    //           },
    //         ],
    //       },
    //       {
    //         association: 'ownerReactions',
    //         required: false,
    //         where: {
    //           createdBy: 1,
    //         },
    //       },
    //     ],
    //     offset: 0,
    //     limit: 3,
    //     order: [['createdAt', 'ASC']],
    //   });
    //
    //   const response = rows.rows.map((r) => r.toJSON());
    //   console.log(1, JSON.stringify(response, null, 4));
    //   await this._mentionService.bindMentionsToComment(response);
    //   await this._commentService.bindUserToComment(response);
    //   console.log(2, JSON.stringify(plainToInstance(CommentResponseDto, response), null, 4));
    // } catch (ex) {
    //   // eslint-disable-next-line no-console
    //   console.log(ex);
    // }
    //   process.exit(0);
  }
}
