import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentCommand } from './update-comment.command';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post.repository.interface';
import { IContentValidator, CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface';
import { COMMENT_REPOSITORY_TOKEN, ICommentRepository } from '../../../domain/repositoty-interface';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import {
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
} from 'apps/api/src/modules/v2-user/application';
import { GroupDto } from 'apps/api/src/modules/v2-group/application';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter/internal-event-emitter.service';
import { CommentHasBeenUpdatedEvent } from '../../../../../events/comment/comment-has-been-updated.event';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand, void> {
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
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

    const comment = await this._commentRepository.findOne({
      id: id,
      createdBy: actor.id,
    });
    if (!comment) throw new CommentNotFoundException();

    const post = (await this._postRepository.findOne({
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
