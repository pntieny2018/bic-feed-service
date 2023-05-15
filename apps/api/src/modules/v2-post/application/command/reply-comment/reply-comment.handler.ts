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
import { ExceptionHelper } from '../../../../../common/helpers';
import { HTTP_STATUS_ID } from '../../../../../common/constants';
import { PostAllow } from '../../../data-type/post-allow.enum';
import { COMMENT_VALIDATOR_TOKEN, ICommentValidator } from '../../../domain/validator/interface';
import { PostEntity } from '../../../domain/model/content/post.entity';
import { ClassTransformer } from 'class-transformer';
import { ReplyCommentCommand } from './reply-comment.command';
import { NIL } from 'uuid';
import { COMMENT_REPOSITORY_TOKEN, ICommentRepository } from '../../../domain/repositoty-interface';
import { UserMentionDto } from '../../dto/user-mention.dto';

@CommandHandler(ReplyCommentCommand)
export class ReplyCommentHandler implements ICommandHandler<ReplyCommentCommand, ReplyCommentDto> {
  private readonly _classTransformer = new ClassTransformer();

  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(COMMENT_VALIDATOR_TOKEN)
    private readonly _commentValidator: ICommentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    private readonly _externalService: ExternalService
  ) {}

  public async execute(command: ReplyCommentCommand): Promise<ReplyCommentDto> {
    const { actor, parentId, postId, content, media, mentions, giphyId } = command.payload;
    let usersMention: UserMentionDto = {};

    const parentComment = await this._commentRepository.findOne({
      id: parentId,
      parentId: NIL,
    });
    if (!parentComment) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_REPLY_NOT_EXISTING);
    }

    const post = (await this._postRepository.findOne({
      where: { id: postId },
      include: {
        shouldIncludeGroup: true,
      },
    })) as PostEntity;
    if (!post) ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_COMMENT_POST_NOT_EXISTING);

    this._commentValidator.checkCanReadPost(post, actor);

    this._commentValidator.allowAction(post, PostAllow.COMMENT);

    if (media?.images.length) {
      const mediaIds = media.images.map((image) => image.id);
      const images = await this._externalService.getImageIds(mediaIds);
      this._commentValidator.validateImagesMedia(images, actor);
      media.images = images;
    }

    if (mentions.length) {
      const users = await this._commentValidator.checkValidMentionsAndReturnUsers(
        post.get('groupIds'),
        mentions
      );
      usersMention = this._commentValidator.mapMentionWithUserInfo(mentions, users);
    }

    const commentEntity = await this._commentDomainService.create({
      userId: actor.id,
      parentId,
      postId,
      content,
      giphyId,
      media,
      mentions: mentions,
    });

    return this._classTransformer.plainToInstance(
      ReplyCommentDto,
      { ...commentEntity.toObject(), mentions: usersMention },
      {
        excludeExtraneousValues: true,
      }
    );
  }
}
