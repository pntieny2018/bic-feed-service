import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentCommand } from './update-comment.command';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { COMMENT_REPOSITORY_TOKEN, ICommentRepository } from '../../../domain/repositoty-interface';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import {
  ContentAccessDeniedException,
  CommentNotFoundException,
  ContentNoCommentPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import {
  COMMENT_DOMAIN_SERVICE_TOKEN,
  ICommentDomainService,
} from '../../../domain/domain-service/interface';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { CommentHasBeenUpdatedEvent } from '../../../../../events/comment';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand, void> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    private readonly _eventEmitter: InternalEventEmitterService
  ) {}

  public async execute(command: UpdateCommentCommand): Promise<void> {
    const { actor, id, mentions } = command.payload;

    const comment = await this._commentRepository.findOne({ id });

    if (!comment) throw new CommentNotFoundException();

    if (!comment.isOwner(actor.id)) throw new ContentAccessDeniedException();

    const post = (await this._contentRepository.findOne({
      where: { id: comment.get('postId'), groupArchived: false, isHidden: false },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;

    if (!post) throw new ContentNotFoundException();

    this._contentValidator.checkCanReadContent(post, actor);

    if (!post.allowComment()) throw new ContentNoCommentPermissionException();

    const groups = post.get('groupIds').map((id) => new GroupDto({ id }));

    let mentionUsers: UserDto[] = [];

    if (mentions) {
      mentionUsers = await this._userApplicationService.findAllByIds(mentions, {
        withGroupJoined: true,
      });
    }
    const oldMentions = comment.get('mentions');

    await this._commentDomainService.update({
      commentEntity: comment,
      groups,
      mentionUsers,
      newData: command.payload,
      actor,
    });

    this._eventEmitter.emit(
      new CommentHasBeenUpdatedEvent({
        actor,
        oldMentions,
        commentId: comment.get('id'),
      })
    );
  }
}
