import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICommentDomainService,
  COMMENT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CreateCommentCommand } from './create-comment.command';
import { IContentRepository, CONTENT_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';
import { CONTENT_VALIDATOR_TOKEN, IContentValidator } from '../../../domain/validator/interface';
import { NIL } from 'uuid';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';
import {
  ContentNotFoundException,
  ContentNoCommentPermissionException,
} from '../../../domain/exception';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import { ImageDto, FileDto, VideoDto, CreateCommentDto } from '../../dto';
import {
  IUserApplicationService,
  USER_APPLICATION_TOKEN,
  UserDto,
} from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application';
import {
  CONTENT_BINDING_TOKEN,
  IContentBinding,
} from '../../binding/binding-post/content.interface';
import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { CommentHasBeenCreatedEvent } from '../../../../../events/comment';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand, CreateCommentDto>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    private readonly _eventEmitter: InternalEventEmitterService
  ) {}

  public async execute(command: CreateCommentCommand): Promise<CreateCommentDto> {
    const { actor, postId, content, media, mentions, giphyId } = command.payload;

    const post = (await this._contentRepository.findOne({
      where: { id: postId, groupArchived: false, isHidden: false },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;

    if (!post) throw new ContentNotFoundException();

    this._contentValidator.checkCanReadContent(post, actor);

    if (!post.allowComment()) throw new ContentNoCommentPermissionException();

    let mentionUsers: UserDto[] = [];
    const groups = post.get('groupIds').map((id) => new GroupDto({ id }));

    if (mentions && mentions.length) {
      mentionUsers = await this._userApplicationService.findAllByIds(mentions, {
        withGroupJoined: true,
      });
    }

    const commentEntity = await this._commentDomainService.create({
      data: {
        userId: actor.id,
        postId,
        parentId: NIL,
        content,
        giphyId,
        media,
        mentions: mentions || [],
      },
      groups,
      mentionUsers,
    });

    this._eventEmitter.emit(
      new CommentHasBeenCreatedEvent({
        actor,
        commentId: commentEntity.get('id'),
      })
    );

    return new CreateCommentDto({
      id: commentEntity.get('id'),
      edited: commentEntity.get('edited'),
      parentId: commentEntity.get('parentId'),
      postId: commentEntity.get('postId'),
      totalReply: commentEntity.get('totalReply'),
      content: commentEntity.get('content'),
      giphyId: commentEntity.get('giphyId'),
      giphyUrl: createUrlFromId(commentEntity.get('giphyId')),
      createdAt: commentEntity.get('createdAt'),
      createdBy: commentEntity.get('createdBy'),
      media: {
        files: commentEntity.get('media').files.map((item) => new FileDto(item.toObject())),
        images: commentEntity.get('media').images.map((item) => new ImageDto(item.toObject())),
        videos: commentEntity.get('media').videos.map((item) => new VideoDto(item.toObject())),
      },
      mentions: this._contentBinding.mapMentionWithUserInfo(mentionUsers),
      actor,
    });
  }
}
