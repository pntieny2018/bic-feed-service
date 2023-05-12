import { BadRequestException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ICommentDomainService,
  COMMENT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { CreateCommentCommand } from './create-comment.command';
import { CreateCommentDto } from './create-comment.dto';
import { MediaStatus } from '../../../data-type';
import { ExternalService } from '../../../../../app/external.service';

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand, CreateCommentDto>
{
  @Inject(COMMENT_DOMAIN_SERVICE_TOKEN)
  private readonly _commentDomainService: ICommentDomainService;
  private readonly _externalService: ExternalService;

  public async execute(command: CreateCommentCommand): Promise<CreateCommentDto> {
    const { actor, postId, content, media, mentions, giphyId } = command.payload;

    if (media?.images.length > 0) {
      const mediaIds = media.images.map((image) => image.id);
      const images = await this._externalService.getImageIds(mediaIds);
      if (images.length === 0) {
        throw new BadRequestException('Invalid image');
      }
      if (images[0].createdBy !== actor.id) {
        throw new BadRequestException('You must be owner this image');
      }
      if (images[0].status !== MediaStatus.DONE) {
        throw new BadRequestException('Image is not ready to use');
      }
      media.images = images;
    }

    const commentEntity = await this._commentDomainService.create({
      userId: actor.id,
      postId,
      content,
      giphyId,
      media,
    });

    /**
     * Validate menntions
     */

    return new CreateCommentDto(commentEntity);
  }
}
