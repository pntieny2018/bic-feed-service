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
import { PostAllow } from '../../../data-type/post-allow.enum';
import { COMMENT_VALIDATOR_TOKEN, ICommentValidator } from '../../../domain/validator/interface';
import { PostEntity } from '../../../domain/model/content/post.entity';
import { ClassTransformer } from 'class-transformer';
import { UserMentionDto } from '../../dto/user-mention.dto';
import { NIL } from 'uuid';
import { createUrlFromId } from '../../../../v2-giphy/giphy.util';
import { ContentNotFoundException } from '../../../domain/exception/content-not-found.exception';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand, CreateCommentDto>
{
  private readonly _classTransformer = new ClassTransformer();

  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(COMMENT_VALIDATOR_TOKEN)
    private readonly _commentValidator: ICommentValidator,
    @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
    private readonly _commentDomainService: ICommentDomainService,
    private readonly _externalService: ExternalService
  ) {}

  public async execute(command: CreateCommentCommand): Promise<CreateCommentDto> {
    const { actor, postId, content, media, mentions, giphyId } = command.payload;
    let usersMention: UserMentionDto = {};

    const post = (await this._postRepository.findOne({
      where: { id: postId, groupArchived: false },
      include: {
        mustIncludeGroup: true,
      },
    })) as PostEntity;

    if (!post) throw new ContentNotFoundException();

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
      parentId: NIL,
      postId,
      content,
      giphyId,
      media,
      mentions: mentions,
    });

    return this._classTransformer.plainToInstance(
      CreateCommentDto,
      { ...commentEntity.toObject(), mentions: usersMention, giphyUrl: createUrlFromId(giphyId) },
      {
        excludeExtraneousValues: true,
      }
    );
  }
}
