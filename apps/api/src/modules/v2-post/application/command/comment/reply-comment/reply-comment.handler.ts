import { GroupDto } from '@libs/service/group/src/group.dto';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  ICommentDomainService,
  COMMENT_DOMAIN_SERVICE_TOKEN,
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../../domain/domain-service/interface';
import { ContentNoCommentPermissionException } from '../../../../domain/exception';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  IContentValidator,
  IMentionValidator,
  MENTION_VALIDATOR_TOKEN,
} from '../../../../domain/validator/interface';
import { COMMENT_BINDING_TOKEN, ICommentBinding } from '../../../binding';
import { CommentBaseDto } from '../../../dto';

import { ReplyCommentCommand } from './reply-comment.command';

@CommandHandler(ReplyCommentCommand)
export class ReplyCommentHandler implements ICommandHandler<ReplyCommentCommand, CommentBaseDto> {
  public constructor(
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomain: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomain: IContentDomainService,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(command: ReplyCommentCommand): Promise<CommentBaseDto> {
    const { actor, contentId, mentions, parentId } = command.payload;

    const content = await this._contentDomain.getVisibleContent(contentId);

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

    const commentEntity = await this._commentDomain.create({
      ...command.payload,
      userId: actor.id,
      parentId,
    });

    return this._commentBinding.commentBinding(commentEntity, { actor });
  }
}
