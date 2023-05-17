import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICommentDomainService,
  COMMENT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ReplyCommentDto } from './reply-comment.dto';
import { ExternalService } from '../../../../../app/external.service';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post.repository.interface';
import {
  CONTENT_VALIDATOR_TOKEN,
  MEDIA_VALIDATOR_TOKEN,
  MENTION_VALIDATOR_TOKEN,
  IContentValidator,
  IMediaValidator,
  IMentionValidator,
} from '../../../domain/validator/interface';
import { ReplyCommentCommand } from './reply-comment.command';
import { NIL } from 'uuid';
import { COMMENT_REPOSITORY_TOKEN, ICommentRepository } from '../../../domain/repositoty-interface';
import { UserMentionDto } from '../../dto/user-mention.dto';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';
import { ImageDto, FileDto, VideoDto } from '../../dto';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import {
  ContentNotFoundException,
  ContentNoCommentPermissionException,
  CommentReplyNotExistException,
  MentionUserNotFoundException,
} from '../../../domain/exception';
import { IUserApplicationService, USER_APPLICATION_TOKEN } from '../../../../v2-user/application';
import { GroupDto } from '../../../../v2-group/application';

@CommandHandler(ReplyCommentCommand)
export class ReplyCommentHandler implements ICommandHandler<ReplyCommentCommand, ReplyCommentDto> {
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(MEDIA_VALIDATOR_TOKEN)
    private readonly _mediaValidator: IMediaValidator,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    @Inject(USER_APPLICATION_TOKEN)
    private readonly _userApplicationService: IUserApplicationService,
    private readonly _externalService: ExternalService
  ) {}

  public async execute(command: ReplyCommentCommand): Promise<ReplyCommentDto> {
    const { actor, parentId, postId, content, media, mentions, giphyId } = command.payload;

    const parentComment = await this._commentRepository.findOne({
      id: parentId,
      parentId: NIL,
    });
    if (!parentComment) throw new CommentReplyNotExistException();

    const post = (await this._postRepository.findOne({
      where: { id: postId, groupArchived: false, isHidden: false },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;
    if (!post) throw new ContentNotFoundException();

    this._contentValidator.checkCanReadContent(post, actor);

    if (!post.allowComment()) throw new ContentNoCommentPermissionException();

    let usersMention: UserMentionDto = {};
    let imagesDto: ImageDto[] = [];

    if (media?.images.length) {
      const images: ImageDto[] = await this._externalService.getImageIds(media?.images);
      this._mediaValidator.validateImagesMedia(images, actor);
      imagesDto = images;
    }

    if (mentions.length) {
      const usersMention = await this._userApplicationService.findAllByIds(mentions, {
        withGroupJoined: true,
      });
      const groups = post.get('groupIds').map((item) => new GroupDto({ id: item }));
      if (usersMention?.length < mentions.length) {
        throw new MentionUserNotFoundException();
      }
      await this._mentionValidator.validateMentionUsers(usersMention, groups);
    }

    const commentEntity = await this._commentDomainService.create({
      userId: actor.id,
      parentId,
      postId,
      content,
      giphyId,
      media: {
        files: [],
        images: imagesDto,
        videos: [],
      },
      mentions: mentions,
    });

    return new ReplyCommentDto({
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
      mentions: usersMention,
    });
  }
}
