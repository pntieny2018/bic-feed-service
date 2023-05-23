import { NIL, v4 } from 'uuid';
import { ImageResource } from '../../data-type';
import { ImageEntity } from '../../domain/model/media';
import { CommentEntity } from '../../domain/model/comment';
import { CreateCommentCommandPayload } from '../../application/command/create-comment/create-comment.command';

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
