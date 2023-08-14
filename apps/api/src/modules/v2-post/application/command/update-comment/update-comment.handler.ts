import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentCommand } from './update-comment.command';
import {
  IContentValidator,
  CONTENT_VALIDATOR_TOKEN,
  MENTION_VALIDATOR_TOKEN,
  IMentionValidator,
} from '../../../domain/validator/interface';
import {
  ContentAccessDeniedException,
  ContentNoCommentPermissionException,
} from '../../../domain/exception';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { CommentHasBeenUpdatedEvent } from '../../../../../events/comment';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand, void> {
  public constructor(
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomainService: IContentDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    private readonly _eventEmitter: InternalEventEmitterService
  ) {}

  public async execute(command: UpdateCommentCommand): Promise<void> {
    const { actor, id, mentions } = command.payload;

    const comment = await this._commentDomainService.getVisibleComment(id);

    if (!comment.isOwner(actor.id)) throw new ContentAccessDeniedException();

    const post = await this._contentDomainService.getVisibleContent(comment.get('postId'));

    this._contentValidator.checkCanReadContent(post, actor);

    if (!post.allowComment()) throw new ContentNoCommentPermissionException();

    if (mentions && mentions.length) {
      const groups = post.get('groupIds').map((id) => new GroupDto({ id }));
      const mentionUsers = await this._userApplicationService.findAllByIds(mentions, {
        withGroupJoined: true,
      });
      await this._mentionValidator.validateMentionUsers(mentionUsers, groups);
    }

    await this._commentDomainService.update({
      ...command.payload,
      userId: actor.id,
      postId: comment.get('postId'),
    });

    this._eventEmitter.emit(
      new CommentHasBeenUpdatedEvent({
        actor,
        oldMentions: comment.get('mentions'),
        commentId: id,
      })
    );
  }
}
