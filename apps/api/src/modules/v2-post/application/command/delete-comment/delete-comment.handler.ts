import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCommentCommand } from './delete-comment.command';
import {
  IContentRepository,
  CONTENT_REPOSITORY_TOKEN,
  COMMENT_REPOSITORY_TOKEN,
  ICommentRepository,
} from '../../../domain/repositoty-interface';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import {
  AccessDeniedException,
  CommentNotFoundException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { CommentHasBeenDeletedEvent } from '../../../../../events/comment/comment-has-been-deleted.event';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand, void> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
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

    if (!comment.isOwner(actor.id)) throw new AccessDeniedException();

    const post = (await this._contentRepository.findOne({
      where: { id: comment.get('postId'), groupArchived: false, isHidden: false },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;

    if (!post) throw new ContentNotFoundException();

    this._contentValidator.checkCanReadContent(post, actor);

    await this._commentRepository.destroyComment(id);

    this._eventEmitter.emit(
      new CommentHasBeenDeletedEvent({
        actor,
        comment,
      })
    );
  }
}
