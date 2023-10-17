import { GroupDto } from '@libs/service/group/src/group.dto';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { NIL } from 'uuid';

import { InternalEventEmitterService } from '../../../../../../app/custom/event-emitter';
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

import { CreateCommentCommand } from './create-comment.command';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler implements ICommandHandler<CreateCommentCommand, CommentDto> {
  public constructor(
    private readonly _event: EventBus,
    @Inject(COMMENT_BINDING_TOKEN)
    private readonly _commentBinding: ICommentBinding,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    private readonly _eventEmitter: InternalEventEmitterService,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    protected readonly _contentDomainService: IContentDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService
  ) {}

  public async execute(command: CreateCommentCommand): Promise<CommentDto> {
    const { actor, contentId, mentions } = command.payload;

    const content = await this._contentDomainService.getVisibleContent(contentId);

    await this._contentValidator.checkCanReadContent(content, actor);

    if (!content.allowComment()) {
      throw new ContentNoCommentPermissionException();
    }

    if (mentions && mentions.length) {
      const groups = content.get('groupIds').map((id) => new GroupDto({ id }));
      const mentionUsers = await this._userApplicationService.findAllByIds(mentions, {
        withGroupJoined: true,
      });
      await this._mentionValidator.validateMentionUsers(mentionUsers, groups);
    }

    const commentEntity = await this._commentDomainService.create({
      ...command.payload,
      userId: actor.id,
      parentId: NIL,
    });

    return this._commentBinding.commentBinding(commentEntity, { actor });
  }
}
