import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../database/models/comment.model';
import { MediaModel } from '../database/models/media.model';
import { MentionModel } from '../database/models/mention.model';
import { plainToInstance } from 'class-transformer';
import { CommentResponseDto } from '../modules/comment/dto/response/comment.response.dto';
import { MentionService } from '../modules/mention';

@Command({ name: 'tinker', description: 'Create shared user and group  data' })
export class SequelizeTinkerCommand implements CommandRunner {
  public constructor(
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    private _mentionService: MentionService
  ) {}

  public async run(): Promise<any> {
    try {
      const rows = await this._commentModel.findAndCountAll({
        where: {
          postId: 1,
          //id: 1,
        },
        attributes: {
          include: [CommentModel.loadReactionsCount()],
        },
        include: [
          {
            model: MediaModel,
            through: {
              attributes: [],
            },
            required: false,
          },
          {
            model: MentionModel,
            required: false,
          },
          {
            model: CommentModel,
            as: 'child',
            limit: 25,
            required: false,
            attributes: {
              include: [CommentModel.loadReactionsCount()],
            },
            include: [
              {
                model: MediaModel,
                through: {
                  attributes: [],
                },
                required: false,
              },
              {
                model: MentionModel,
                as: 'mentions',
                required: false,
              },
            ],
          },
          {
            association: 'ownerReactions',
            required: false,
            where: {
              createdBy: 1,
            },
          },
        ],
        offset: 0,
        limit: 3,
        order: [['createdAt', 'ASC']],
      });

      const response = rows.rows.map((r) => r.toJSON());
      // console.log(JSON.stringify(response, null, 4));
      await this._mentionService.bindMentionsToComment(response);
      console.log(JSON.stringify(plainToInstance(CommentResponseDto, response), null, 4));
    } catch (ex) {
      // eslint-disable-next-line no-console
      console.log(ex);
    }
    process.exit(0);
  }
}
