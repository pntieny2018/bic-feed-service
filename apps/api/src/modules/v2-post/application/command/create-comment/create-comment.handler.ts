import { ForbiddenException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICommentDomainService,
  COMMENT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CreateCommentCommand } from './create-comment.command';
import { CreateCommentDto } from './create-comment.dto';
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
import { UserMentionDto } from '../../dto/user-mention.dto';
import { NIL } from 'uuid';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';
import { ContentNotFoundException } from '../../../domain/exception/content-not-found.exception';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import { ImageDto, FileDto, VideoDto } from '../../dto';
import { HTTP_STATUS_ID } from '../../../../../common/constants';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand, CreateCommentDto>
{
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(CONTENT_VALIDATOR_TOKEN)
    private readonly _contentValidator: IContentValidator,
    @Inject(MEDIA_VALIDATOR_TOKEN)
    private readonly _mediaValidator: IMediaValidator,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    private readonly _externalService: ExternalService
  ) {}

  public async execute(command: CreateCommentCommand): Promise<CreateCommentDto> {
    const { actor, postId, content, media, mentions, giphyId } = command.payload;

    const post = (await this._postRepository.findOne({
      where: { id: postId, groupArchived: false, isHidden: false },
      include: {
        mustIncludeGroup: true,
      },
    })) as ContentEntity;

    if (!post) throw new ContentNotFoundException();

    this._contentValidator.checkCanReadContent(post, actor);

    if (!post.allowComment()) {
      throw new ForbiddenException({
        code: HTTP_STATUS_ID.API_FORBIDDEN,
        message: 'Comment action on this content is not available',
      });
    }

    let usersMention: UserMentionDto = {};
    let imagesDto: ImageDto[] = [];

    if (media?.images.length) {
      const images: ImageDto[] = await this._externalService.getImageIds(media?.images);
      this._mediaValidator.validateImagesMedia(images, actor);
      imagesDto = images;
    }

    if (mentions.length) {
      const users = await this._mentionValidator.checkValidMentionsAndReturnUsers(
        post.get('groupIds'),
        mentions
      );
      usersMention = this._mentionValidator.mapMentionWithUserInfo(mentions, users);
    }

    const commentEntity = await this._commentDomainService.create({
      userId: actor.id,
      parentId: NIL,
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
      mentions: usersMention,
    });
  }
}
