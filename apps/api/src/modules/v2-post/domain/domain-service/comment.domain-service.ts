import { ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { NIL } from 'uuid';

import { DatabaseException } from '../../../../common/exceptions';
import {
  CommentNotEmptyException,
  CommentNotFoundException,
  CommentReplyNotExistException,
  InvalidResourceImageException,
} from '../exception';
import { ICommentFactory, COMMENT_FACTORY_TOKEN } from '../factory/interface';
import { CommentEntity } from '../model/comment';
import { ICommentRepository, COMMENT_REPOSITORY_TOKEN } from '../repositoty-interface';

import {
  CreateCommentProps,
  GetCommentsAroundIdProps,
  ICommentDomainService,
  UpdateCommentProps,
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from './interface';

@Injectable()
export class CommentDomainService implements ICommentDomainService {
  private readonly _logger = new Logger(CommentDomainService.name);

  public constructor(
    @Inject(COMMENT_FACTORY_TOKEN)
    private readonly _commentFactory: ICommentFactory,
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService
  ) {}

  public async getVisibleComment(
    id: string,
    excludeReportedByUserId?: string
  ): Promise<CommentEntity> {
    const entity = await this._commentRepository.findOne(
      { id },
      excludeReportedByUserId && {
        excludeReportedByUserId,
      }
    );
    if (!entity) {
      throw new CommentNotFoundException();
    }
    return entity;
  }

  public async getCommentsAroundId(
    id: string,
    props: GetCommentsAroundIdProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const comment = await this._commentRepository.findOne({ id });
    const isChild = comment.isChildComment();

    if (isChild) {
      return this._getCommentsAroundChild(comment, props);
    }
    return this._getCommentsAroundParent(comment, props);
  }

  public async create(input: CreateCommentProps): Promise<CommentEntity> {
    const { media, parentId } = input;

    if (parentId !== NIL) {
      const parentComment = await this._commentRepository.findOne({
        id: parentId,
        parentId: NIL,
      });
      if (!parentComment) {
        throw new CommentReplyNotExistException();
      }
    }

    const commentEntity = this._commentFactory.createComment(input);

    if (media) {
      await this._setCommentMedia(commentEntity, media);
    }

    try {
      return this._commentRepository.createComment(commentEntity);
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async update(input: UpdateCommentProps): Promise<void> {
    const { id, userId, content, giphyId, mentions, media } = input;
    const commentEntity = await this._commentRepository.findOne({ id });

    if (media) {
      await this._setCommentMedia(commentEntity, media);
    }

    commentEntity.updateAttribute({ content, giphyId, mentions }, userId);

    if (commentEntity.isEmptyComment()) {
      throw new CommentNotEmptyException();
    }

    if (!commentEntity.isChanged()) {
      return;
    }

    await this._commentRepository.update(commentEntity);
  }

  public async delete(id: string): Promise<void> {
    return this._commentRepository.destroyComment(id);
  }

  private async _getCommentsAroundChild(
    child: CommentEntity,
    pagination: GetCommentsAroundIdProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const commentId = child.get('id');
    const parentId = child.get('parentId');
    const { userId, targetChildLimit, limit } = pagination;

    const aroundChild = await this._commentRepository.getAroundComment(commentId, {
      limit: targetChildLimit,
      order: ORDER.DESC,
      authUserId: userId,
    });

    const { rows, meta, targetIndex } = await this._commentRepository.getAroundComment(parentId, {
      limit,
      order: ORDER.DESC,
      authUserId: userId,
    });

    rows[targetIndex].setChilds({ rows: aroundChild.rows, meta: aroundChild.meta });

    return { rows, meta };
  }

  private async _getCommentsAroundParent(
    parent: CommentEntity,
    pagination: GetCommentsAroundIdProps
  ): Promise<CursorPaginationResult<CommentEntity>> {
    const contentId = parent.get('postId');
    const commentId = parent.get('id');
    const { userId, targetChildLimit, limit } = pagination;

    const { rows, meta, targetIndex } = await this._commentRepository.getAroundComment(commentId, {
      limit,
      order: ORDER.DESC,
      authUserId: userId,
    });

    const childsPagination = await this._commentRepository.getPagination({
      authUserId: userId,
      contentId,
      parentId: commentId,
      limit: targetChildLimit,
      order: ORDER.DESC,
    });

    if (childsPagination && childsPagination.rows?.length) {
      rows[targetIndex].setChilds(childsPagination);
    }

    return { rows, meta };
  }

  private async _setCommentMedia(
    commentEntity: CommentEntity,
    media: {
      files: string[];
      images: string[];
      videos: string[];
    }
  ): Promise<void> {
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
}
