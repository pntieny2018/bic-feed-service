import { Inject } from '@nestjs/common';
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
import { ExceptionHelper } from '../../../../../common/helpers';
import { HTTP_STATUS_ID } from '../../../../../common/constants';
import { CONTENT_VALIDATOR_TOKEN } from '../../../domain/validator/interface/content.validator.interface';
import { PostAllow } from '../../../data-type/post-allow.enum';
import { ICommentValidator } from '../../../domain/validator/interface';
import { PostEntity } from '../../../domain/model/post';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand, CreateCommentDto>
{
  @Inject(POST_REPOSITORY_TOKEN)
  private readonly _postRepository: IPostRepository;
  @Inject(CONTENT_VALIDATOR_TOKEN)
  private readonly _commentValidator: ICommentValidator;
  @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
  private readonly _commentDomainService: ICommentDomainService;
  private readonly _externalService: ExternalService;

  public async execute(command: CreateCommentCommand): Promise<CreateCommentDto> {
    const { actor, postId, content, media, mentions, giphyId } = command.payload;

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

    const mentionUserIds = Object.values(mentions || {}).map((item) => item.id);

    if (mentionUserIds.length) {
      await this._commentValidator.checkValidMentions(post.get('groupIds'), mentionUserIds);
    }

    const commentEntity = await this._commentDomainService.create({
      userId: actor.id,
      postId,
      content,
      giphyId,
      media,
      mentions: mentionUserIds,
    });

    return new CreateCommentDto(commentEntity);
  }
}
