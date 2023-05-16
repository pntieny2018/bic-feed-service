import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCommentCommand } from './update-comment.command';
import { ExternalService } from '../../../../../app/external.service';
import {
  IPostRepository,
  POST_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface/post.repository.interface';
import {
  ICommentValidator,
  IMediaValidator,
  IMentionValidator,
  COMMENT_VALIDATOR_TOKEN,
  MEDIA_VALIDATOR_TOKEN,
  MENTION_VALIDATOR_TOKEN,
} from '../../../domain/validator/interface';
import { COMMENT_REPOSITORY_TOKEN, ICommentRepository } from '../../../domain/repositoty-interface';
import { ContentEntity } from '../../../domain/model/content/content.entity';
import {
  CommentNotFoundException,
  ContentNoCommentPermissionException,
  ContentNotFoundException,
} from '../../../domain/exception';
import { ImageDto } from '../../dto';
import { IComment } from 'apps/api/src/database/models/comment.model';

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler implements ICommandHandler<UpdateCommentCommand, boolean> {
  constructor(
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly _postRepository: IPostRepository,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(MEDIA_VALIDATOR_TOKEN)
    private readonly _mediaValidator: IMediaValidator,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(COMMENT_VALIDATOR_TOKEN)
    private readonly _commentValidator: ICommentValidator,
    private readonly _externalService: ExternalService
  ) {}

  public async execute(command: UpdateCommentCommand): Promise<boolean> {
    const { actor, id, content, media, mentions, giphyId } = command.payload;
    const updateData: Partial<IComment> = {
      updatedBy: actor.id,
      edited: true,
    };

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

    if (!post.allowComment()) throw new ContentNoCommentPermissionException();

    const updateMasks = this._commentValidator.getUpdateMasks(command.payload, comment);

    if (updateMasks.includes('content')) updateData.content = content;

    if (updateMasks.includes('giphyId')) updateData.content = giphyId;

    if (updateMasks.includes('mediaJson')) {
      const images: ImageDto[] = await this._externalService.getImageIds(media.images);
      this._mediaValidator.validateImagesMedia(images, actor);
      updateData.mediaJson = {
        images,
        files: [],
        videos: [],
      };
    }

    if (updateMasks.includes('mentions')) {
      await this._mentionValidator.checkValidMentionsAndReturnUsers(post.get('groupIds'), mentions);
      updateData.mentions = mentions;
    }

    return this._commentRepository.updateComment(id, updateData);
  }
}
