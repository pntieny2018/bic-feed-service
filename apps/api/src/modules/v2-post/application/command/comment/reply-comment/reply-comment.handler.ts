import { GroupDto } from '@libs/service/group/src/group.dto';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { InternalEventEmitterService } from '../../../../../../app/custom/event-emitter';
import { CommentHasBeenCreatedEvent } from '../../../../../../events/comment';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
} from '../../../../../v2-user/application';
import {
  ICommentDomainService,
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentHasSeenEvent } from '../../../../domain/event';
import { ContentNoCommentPermissionException } from '../../../../domain/exception';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
  IMentionValidator,
  MENTION_VALIDATOR_TOKEN,
} from '../../../../domain/validator/interface';
import {
  COMMENT_BINDING_TOKEN,
  ICommentBinding,
} from '../../../binding/binding-comment/comment.interface';
import { CommentDto } from '../../../dto';

import { ReplyCommentCommand } from './reply-comment.command';

@CommandHandler(ReplyCommentCommand)
export class ReplyCommentHandler implements ICommandHandler<ReplyCommentCommand, CommentDto> {
  public constructor(
    private readonly _event: EventBus,
    private readonly _eventEmitter: InternalEventEmitterService,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomainService: IContentDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService
  ) {}

  public async execute(command: ReplyCommentCommand): Promise<CommentDto> {
    const { actor, postId, mentions, parentId } = command.payload;

    const post = await this._contentDomainService.getVisibleContent(postId);

    this._contentValidator.checkCanReadContent(post, actor);

    if (!post.allowComment()) {
      throw new ContentNoCommentPermissionException();
    }

    if (mentions && mentions.length) {
      const groups = post.get('groupIds').map((id) => new GroupDto({ id }));
      const mentionUsers = await this._userApplicationService.findAllByIds(mentions, {
        withGroupJoined: true,
      });
      await this._mentionValidator.validateMentionUsers(mentionUsers, groups);
    }

    const commentEntity = await this._commentDomainService.create({
      ...command.payload,
      userId: actor.id,
      parentId,
    });

    this._event.publish(new ContentHasSeenEvent({ contentId: postId, userId: actor.id }));

    this._eventEmitter.emit(
      new CommentHasBeenCreatedEvent({
        actor,
        commentId: commentEntity.get('id'),
      })
    );

    return this._commentBinding.commentBinding(commentEntity, { actor });
  }
}
