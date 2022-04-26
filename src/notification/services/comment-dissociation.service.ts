import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CommentModel } from '../../database/models/comment.model';

export class CommentDissociationService {
  private _logger = new Logger(CommentDissociationService.name);
  public constructor(
    @InjectModel(CommentModel) private readonly _commentModel: typeof CommentModel
  ) {}

  public async dissociate(commentId: number) {
    try {
      const comment = await this._commentModel.findOne();
    } catch (ex) {}
  }
}
