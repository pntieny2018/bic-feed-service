import { ORDER } from '@beincom/constants';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { NIL } from 'uuid';

import { DatabaseException } from '../../../../common/exceptions';
import {
  CommentRecipientDto,
  ReplyCommentRecipientDto,
} from '../../../v2-notification/application/dto';
import { CommentCreatedEvent } from '../event/comment.event';
import {
  CommentNotEmptyException,
  CommentNotFoundException,
  CommentReplyNotExistException,
  InvalidResourceImageException,
} from '../exception';
import { CommentEntity } from '../model/comment';
import { ICommentRepository, COMMENT_REPOSITORY_TOKEN } from '../repositoty-interface';

import {
  CreateCommentProps,
  GetCommentsAroundIdProps,
  ICommentDomainService,
  UpdateCommentProps,
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
  DissociateCommentProps,
} from './interface';

@Injectable()
export class CommentDomainService implements ICommentDomainService {
  private readonly _logger = new Logger(CommentDomainService.name);

  public constructor(
    @Inject(COMMENT_REPOSITORY_TOKEN)
    private readonly _commentRepository: ICommentRepository,
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,

    private readonly event: EventBus
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

  // public async getCommentsByIds(ids: string[]): Promise<CommentEntity[]> {
  //   return this._commentRepository.findByIds(ids);
  // }

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

  public async create(props: CreateCommentProps): Promise<CommentEntity> {
    const { media, parentId } = props;

    if (parentId !== NIL) {
      const parentComment = await this._commentRepository.findOne({
        id: parentId,
        parentId: NIL,
      });
      if (!parentComment) {
        throw new CommentReplyNotExistException();
      }
    }

    const commentEntity = CommentEntity.create(
      {
        postId: props.contentId,
        ...(props?.parentId && { parentId: props.parentId }),
        ...(props?.content && { content: props.content }),
        ...(props?.mentions && { mentions: props.mentions }),
        ...(props?.giphyId && { giphyId: props.giphyId }),
      },
      props.userId
    );

    if (media) {
      await this._setCommentMedia(commentEntity, media);
    }

    try {
      const res = await this._commentRepository.createComment(commentEntity);
      this.event.publish(new CommentCreatedEvent({ comment: res, user: props.actor }));
      return res;
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      throw new DatabaseException();
    }
  }

  public async update(input: UpdateCommentProps): Promise<void> {
    const { commentId, userId, content, giphyId, mentions, media } = input;
    const commentEntity = await this._commentRepository.findOne({ id: commentId });

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
    const postId = parent.get('postId');
    const commentId = parent.get('id');
    const { userId, targetChildLimit, limit } = pagination;

    const { rows, meta, targetIndex } = await this._commentRepository.getAroundComment(commentId, {
      limit,
      order: ORDER.DESC,
      authUserId: userId,
    });

    const childsPagination = await this._commentRepository.getPagination({
      authUserId: userId,
      postId,
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

  public async dissociateComment(
    props: DissociateCommentProps
  ): Promise<CommentRecipientDto | ReplyCommentRecipientDto> {
    const { commentId, userId, contentDto } = props;
    const recipient = CommentRecipientDto.init();

    const groupAudienceIds = contentDto.audience.groups.map((group) => group.id);
    const contentMentions = Array.isArray(contentDto.mentions)
      ? []
      : Object.values(contentDto.mentions || {});

    try {
      const commentEntity = await this._commentRepository.findOne({
        id: commentId,
      });
      if (!commentEntity) {
        throw new CommentNotFoundException();
      }

      if (commentEntity.isChildComment()) {
        return this.dissociateReplyComment(userId, commentEntity, groupAudienceIds);
      }

      /**
       * User who created post
       * Will equal null if post creator comment to self's post
       */
      const contentOwnerId = contentDto.actor.id === userId ? null : contentDto.actor.id;

      /**
       * users who mentioned in post
       */
      const mentionedUsersInPost = contentMentions.map((mention) => mention.id);

      /**
       * users who mentioned in created comment
       */
      const mentionedUsersInComment = commentEntity.get('mentions') ?? [];

      const prevCommentsRes = await this._commentRepository.findPrevComments(
        commentId,
        contentDto.id
      );

      const ignoreUserIds = contentOwnerId
        ? [
            ...new Set([
              userId,
              contentOwnerId,
              ...mentionedUsersInComment,
              ...mentionedUsersInPost,
            ]),
          ]
        : [...new Set([userId, ...mentionedUsersInComment, ...mentionedUsersInPost])];

      const prevComments = prevCommentsRes.filter(
        (pc) => !ignoreUserIds.includes(pc.get('createdBy'))
      );

      /**
       * users who created prev comments
       */
      const actorIdsOfPrevComments = prevComments.map((comment) => comment.get('createdBy'));

      /**
       * users who was checked if users followed group audience
       */
      const checkUserIds = [
        contentOwnerId,
        ...mentionedUsersInComment,
        ...actorIdsOfPrevComments,
        ...mentionedUsersInPost,
      ];

      if (!checkUserIds.length) {
        return recipient;
      }

      const validUserIds = await this._commentRepository.getValidUsersFollow(
        [...new Set(checkUserIds)].filter((id) => id),
        groupAudienceIds
      );

      /**
       * priority:
       *        1. mentioned you in a comment.
       *        2. commented on your post.
       *        3. commented to a post you're mentioned.
       *        4. also commented on a post.
       */

      const handledUserIds = [];
      for (const validUserId of validUserIds) {
        if (!handledUserIds.includes(validUserId)) {
          if (mentionedUsersInComment.includes(validUserId)) {
            recipient.mentionedUsersInComment.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }

          if (validUserId === contentOwnerId && contentOwnerId !== null) {
            recipient.postOwnerId = validUserId;
            handledUserIds.push(validUserId);
            continue;
          }

          if (mentionedUsersInPost.includes(validUserId)) {
            recipient.mentionedUsersInPost.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }
          if (actorIdsOfPrevComments.includes(validUserId)) {
            recipient.actorIdsOfPrevComments.push(validUserId);
            handledUserIds.push(validUserId);
          }
        }
      }

      // call back to return prev comments
      if (props.cb) {
        props.cb(prevCommentsRes);
      }
      return recipient;
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      return recipient;
    }
  }

  public async dissociateReplyComment(
    userId: string,
    commentEntity: CommentEntity,
    groupAudienceIds: string[]
  ): Promise<ReplyCommentRecipientDto> {
    try {
      const recipient = ReplyCommentRecipientDto.init();

      const parentComment = await this._commentRepository.getParentComment(
        commentEntity.get('id'),
        commentEntity.get('parentId')
      );

      if (!parentComment) {
        throw new CommentNotFoundException();
      }

      const parentCommentCreatorId =
        parentComment.get('createdBy') === userId ? null : parentComment.get('createdBy');

      const mentionedUserIdsInComment = commentEntity.get('mentions') ?? [];

      const mentionedUserIdsInParentComment = parentComment.get('mentions') ?? [];

      const prevChildCommentCreatorIds = [];

      const mentionedUserIdsInPrevChildComment = [];

      parentComment.get('childs').rows.forEach((comment) => {
        prevChildCommentCreatorIds.push(comment.get('createdBy'));
        mentionedUserIdsInPrevChildComment.push(...comment.get('mentions'));
      });

      const handledUserIds = [];

      const validUserIds = await this._commentRepository.getValidUsersFollow(
        [
          ...new Set([
            parentCommentCreatorId,
            ...mentionedUserIdsInComment,
            ...mentionedUserIdsInParentComment,
            ...prevChildCommentCreatorIds,
            ...mentionedUserIdsInPrevChildComment,
          ]),
        ].filter((id) => id),
        groupAudienceIds
      );

      /**
       * priority:
       *        1. mentioned you in a comment.
       *        2. replied your comment.
       *        3. replied on a comment you are mentioned. (mentioned user in prev reply comment)
       *        4. also replied on a comment you are replied.
       *        5. replied on a comment you are mentioned. (mentioned user in parent comment)
       */
      for (const validUserId of validUserIds.filter((id) => id !== userId)) {
        if (!handledUserIds.includes(validUserId)) {
          if (mentionedUserIdsInComment.includes(validUserId)) {
            recipient.mentionedUserIdsInComment.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }

          if (parentCommentCreatorId === validUserId && parentCommentCreatorId !== null) {
            recipient.parentCommentCreatorId = validUserId;
            handledUserIds.push(validUserId);
            continue;
          }
          if (mentionedUserIdsInParentComment.includes(validUserId)) {
            recipient.mentionedUserIdsInParentComment.push(validUserId);
            handledUserIds.push(validUserId);
            continue;
          }
          if (prevChildCommentCreatorIds.includes(validUserId)) {
            recipient.prevChildCommentCreatorIds.push(validUserId);
            handledUserIds.push(validUserId);
          }
        }
      }
      return recipient;
    } catch (ex) {
      this._logger.error(JSON.stringify(ex?.stack));
      return null;
    }
  }
}
