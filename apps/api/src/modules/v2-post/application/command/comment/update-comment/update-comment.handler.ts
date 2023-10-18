import { GroupDto } from '@libs/service/group/src/group.dto';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import {
  ContentAccessDeniedException,
  ContentNoCommentPermissionException,
} from '../../../../domain/exception';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';
import {
  IContentValidator,
  CONTENT_VALIDATOR_TOKEN,
  MENTION_VALIDATOR_TOKEN,
  IMentionValidator,
} from '../../../../domain/validator/interface';

import { UpdateCommentCommand } from './update-comment.command';

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
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(command: UpdateCommentCommand): Promise<void> {
    const { actor, commentId, mentions } = command.payload;

    const comment = await this._commentDomainService.getVisibleComment(commentId);

    if (!comment.isOwner(actor.id)) {
      throw new ContentAccessDeniedException();
    }

    const content = await this._contentDomainService.getVisibleContent(comment.get('postId'));

    await this._contentValidator.checkCanReadContent(content, actor);

    if (!content.allowComment()) {
      throw new ContentNoCommentPermissionException();
    }

    if (mentions && mentions.length) {
      const groups = content.get('groupIds').map((id) => new GroupDto({ id }));
      const mentionUsers = await this._userAdapter.getUsersByIds(mentions, {
        withGroupJoined: true,
      });
      await this._mentionValidator.validateMentionUsers(mentionUsers, groups);
    }

    await this._commentDomainService.update({
      ...command.payload,
      userId: actor.id,
      contentId: comment.get('postId'),
    });
  }
}
