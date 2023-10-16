import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { InternalEventEmitterService } from '../../../../../../app/custom/event-emitter';
import { CommentHasBeenDeletedEvent } from '../../../../../../events/comment/comment-has-been-deleted.event';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentAccessDeniedException } from '../../../../domain/exception';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../../domain/validator/interface';

import { DeleteCommentCommand } from './delete-comment.command';

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler implements ICommandHandler<DeleteCommentCommand, void> {
  public constructor(
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomainService: IContentDomainService,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    private readonly _eventEmitter: InternalEventEmitterService
  ) {}

  public async execute(command: DeleteCommentCommand): Promise<void> {
    const { actor, id } = command.payload;

    const comment = await this._commentDomainService.getVisibleComment(id);

    if (!comment.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }

    const post = await this._contentDomainService.getVisibleContent(comment.get('postId'));

    this._contentValidator.checkCanReadContent(post, actor);

    await this._commentDomainService.delete(id);

    this._eventEmitter.emit(
      new CommentHasBeenDeletedEvent({
        actor,
        comment,
      })
    );
  }
}
