import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCommentCommand } from './delete-comment.command';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post.repository.interface';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { COMMENT_REPOSITORY_TOKEN, ICommentRepository } from '../../../domain/repositoty-interface';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import { CommentNotFoundException, ContentNotFoundException } from '../../../domain/exception';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand, void> {
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator
  ) {}

  public async execute(command: DeleteCommentCommand): Promise<void> {
    const { actor, id } = command.payload;

    const comment = await this._commentRepository.findOne({
      id: id,
      createdBy: actor.id,
    });
    if (!comment) throw new CommentNotFoundException();

    const post = (await this._postRepository.findOne({
      where: { id: comment.get('postId'), groupArchived: false, isHidden: false },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;

    if (!post) throw new ContentNotFoundException();

    this._contentValidator.checkCanReadContent(post, actor);

    await this._commentRepository.destroyComment(id);
  }
}
