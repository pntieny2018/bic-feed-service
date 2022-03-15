import { UserDto } from '../auth';
import { Sequelize } from 'sequelize-typescript';
import { CreateCommentDto } from './dto/requests';
import { MediaModel } from '../../database/models/media.model';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../../database/models/comment.model';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MentionModel } from '../../database/models/mention.model';
import { MentionService } from '../mention';
import { MentionableType } from '../../common/constants';

@Injectable()
export class CommentService {
  private _logger = new Logger(CommentService.name);

  public constructor(
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(CommentModel) private _commentModel: typeof CommentModel,
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    @InjectModel(MentionModel) private _mentionModel: typeof MentionModel,
    private _mentionService: MentionService
  ) {}

  public async create(user: UserDto, createCommentDto: CreateCommentDto): Promise<CommentModel> {
    //TODO : check post existed and can create comment
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const comment = await this._commentModel.create({
        createdBy: user.userId,
        updatedBy: user.userId,
        parentId: createCommentDto.parentId,
        content: createCommentDto.content,
        postId: createCommentDto.postId,
      });

      const userIds = createCommentDto?.mentions.userIds ?? [];

      if (createCommentDto?.content && userIds.length) {
        await this._mentionService.checkValidMentions([], createCommentDto.content, userIds);

        await this._mentionModel.bulkCreate(
          userIds.map((userId) => ({
            entityId: comment.id,
            userId: userId,
            mentionableType: MentionableType.COMMENT,
          }))
        );
      }

      if (createCommentDto?.mediaIds && createCommentDto.mediaIds.length) {
        await comment.addMedia(createCommentDto.mediaIds);
      }

      const commentResponse = await this.get(comment.id);

      await transaction.commit();

      return commentResponse;
    } catch (ex) {
      await transaction.rollback();
      throw new InternalServerErrorException("Can't create comment");
    }
  }

  protected async get(commentID: number): Promise<CommentModel> {
    this._logger.debug(`get comment with id: ${commentID}`);

    return await this._commentModel.findOne({
      where: {
        id: commentID,
      },
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
        },
      ],
    });
  }

  public update(): void {
    this._logger.log('update comment');
  }

  public destroy(): void {
    this._logger.log('delete comment');
  }
}
