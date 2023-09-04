import { NIL, v4 } from 'uuid';

import { CreateCommentCommandPayload } from '../../application/command/comment';
import { ImageResource } from '../../data-type';
import { CommentEntity } from '../../domain/model/comment';
import { FileEntity, ImageEntity, VideoEntity } from '../../domain/model/media';

import { commentRecord } from './comment.model.mock';

export const createCommentEntity = (
  payload: Partial<CreateCommentCommandPayload>,
  postId: string,
  parentId?: string
): CommentEntity => {
  return new CommentEntity({
    id: v4(),
    postId: postId,
    parentId: parentId || NIL,
    content: payload.content,
    giphyId: payload.giphyId,
    media: {
      files: [],
      images: [
        {
          id: v4(),
          src: '/image/variants/comment/content/ea62f4f6-92a1-4c0b-9f4a-7680544e6a44',
          url: 'https://media.beincom.io/image/variants/comment/content/ea62f4f6-92a1-4c0b-9f4a-7680544e6a44',
          width: 1000,
          height: 667,
          status: 'DONE',
          mimeType: 'image/jpeg',
          resource: ImageResource.COMMENT_CONTENT,
          createdBy: '001072e1-d214-4d3d-beab-8a5bb8784cc4',
        },
      ].map((item) => new ImageEntity(item)),
      videos: [],
    },
    mentions: payload.mentions || [],
    createdBy: payload.actor.id,
    updatedBy: payload.actor.id,
  });
};

export const commentEntityMock = new CommentEntity({
  id: commentRecord.id,
  postId: commentRecord.postId,
  parentId: commentRecord.parentId,
  edited: commentRecord.edited,
  isHidden: commentRecord.isHidden,
  giphyId: commentRecord.giphyId,
  totalReply: commentRecord.totalReply,
  createdBy: commentRecord.createdBy,
  updatedBy: commentRecord.updatedBy,
  createdAt: commentRecord.createdAt,
  updatedAt: commentRecord.updatedAt,
  content: commentRecord.content,
  mentions: commentRecord.mentions,
  media: {
    images: commentRecord.mediaJson?.images.map((image) => new ImageEntity(image)),
    files: commentRecord.mediaJson?.files.map((file) => new FileEntity(file)),
    videos: commentRecord.mediaJson?.videos.map((video) => new VideoEntity(video)),
  },
});
