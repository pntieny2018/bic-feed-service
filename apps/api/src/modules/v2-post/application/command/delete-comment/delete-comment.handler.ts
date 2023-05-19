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
import {
  CommentNotFoundException,
  ContentNoCRUDPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter/internal-event-emitter.service';
import { CommentHasBeenDeletedEvent } from 'apps/api/src/events/comment/comment-has-been-deleted.event';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand, void> {
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    private readonly _eventEmitter: InternalEventEmitterService
  ) {}

  public async execute(command: DeleteCommentCommand): Promise<void> {
    const { actor, id } = command.payload;

    const comment = await this._commentRepository.findOne({ id });

    if (!comment) throw new CommentNotFoundException();

    if (!comment.isOwner(actor.id)) throw new ContentNoCRUDPermissionException();

    const post = (await this._postRepository.findOne({
      where: { id: comment.get('postId'), groupArchived: false, isHidden: false },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;

    if (!post) throw new ContentNotFoundException();

    this._contentValidator.checkCanReadContent(post, actor);

    const deletedComent = await this._commentRepository.destroyComment(id);

    this._eventEmitter.emit(
      new CommentHasBeenDeletedEvent({
        actor,
        comment: deletedComent,
      })
    );
  }
}
