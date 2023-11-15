import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
    private readonly _contentValidator: IContentValidator
  ) {}

  public async execute(command: DeleteCommentCommand): Promise<void> {
    const { actor, commentId } = command.payload;

    const comment = await this._commentDomainService.getVisibleComment(commentId);

    if (!comment.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }

    const content = await this._contentDomainService.getVisibleContent(comment.get('postId'));

    await this._contentValidator.checkCanReadContent(content, actor);

    return this._commentDomainService.delete(comment, actor);
  }
}
