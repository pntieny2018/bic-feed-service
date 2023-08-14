import { NIL } from 'uuid';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseException } from '../../../../common/exceptions/database.exception';
import { ICommentFactory, COMMENT_FACTORY_TOKEN } from '../factory/interface';
import { CreateCommentProps, ICommentDomainService, UpdateCommentProps } from './interface';
import { CommentEntity } from '../model/comment';
import { ICommentRepository, COMMENT_REPOSITORY_TOKEN } from '../repositoty-interface';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface/media.domain-service.interface';
import { InvalidResourceImageException } from '../exception/media.exception';
import { CommentNotEmptyException, CommentReplyNotExistException } from '../exception';
import { IMentionValidator, MENTION_VALIDATOR_TOKEN } from '../validator/interface';

@Injectable()
export class CommentDomainService implements ICommentDomainService {
  private readonly _logger = new Logger(CommentDomainService.name);

  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _commentFactory: ICommentFactory,
    @Inject(MENTION_VALIDATOR_TOKEN)
    private readonly _mentionValidator: IMentionValidator,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService
  ) {}

  public async create(input: CreateCommentProps): Promise<CommentEntity> {
    const { media, parentId } = input;

    if (parentId !== NIL) {
      const parentComment = await this._commentRepository.findOne({
        id: parentId,
        parentId: NIL,
      });
      if (!parentComment) throw new CommentReplyNotExistException();
    }

    const commentEntity = this._commentFactory.createComment(input);

    if (media) {
      const images = await this._mediaDomainService.getAvailableImages(
        commentEntity.get('media').images,
        media?.images,
        commentEntity.get('createdBy')
      );
      if (images.some((image) => !image.isCommentContentResource())) {
        throw new InvalidResourceImageException();
      }
      const files = await this._mediaDomainService.getAvailableFiles(
        commentEntity.get('media').files,
        media?.files,
        commentEntity.get('createdBy')
      );
      const videos = await this._mediaDomainService.getAvailableVideos(
        commentEntity.get('media').videos,
        media?.videos,
        commentEntity.get('createdBy')
      );
      commentEntity.setMedia({
        files,
        images,
        videos,
      });
    }

    try {
      return this._commentRepository.createComment(commentEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async update(input: UpdateCommentProps): Promise<void> {
    const { commentEntity, newData, groups, mentionUsers } = input;
    const { media, ...restUpdate } = newData;

    if (media) {
      const images = await this._mediaDomainService.getAvailableImages(
        commentEntity.get('media').images,
        media?.images,
        commentEntity.get('createdBy')
      );
      if (images.some((image) => !image.isCommentContentResource())) {
        throw new InvalidResourceImageException();
      }
      const files = await this._mediaDomainService.getAvailableFiles(
        commentEntity.get('media').files,
        media?.files,
        commentEntity.get('createdBy')
      );
      const videos = await this._mediaDomainService.getAvailableVideos(
        commentEntity.get('media').videos,
        media?.videos,
        commentEntity.get('createdBy')
      );
      commentEntity.setMedia({
        files,
        images,
        videos,
      });
    }

    commentEntity.updateAttribute(restUpdate, input.actor.id);

    if (commentEntity.isEmptyComment()) throw new CommentNotEmptyException();

    await this._mentionValidator.validateMentionUsers(mentionUsers, groups);
    if (!commentEntity.isChanged()) return;

    await this._commentRepository.update(commentEntity);
  }
}
