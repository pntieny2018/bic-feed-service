import { createUrlFromId } from '../../../giphy/giphy.util';
import { UserDto } from '../../../v2-user/application';
import { CreateCommentDto } from '../../application/command/create-comment/create-comment.dto';
import { FileDto, ImageDto, VideoDto } from '../../application/dto';
import { CommentEntity } from '../../domain/model/comment';
import { userMentions, userMock } from './user.dto.mock';

export const createCommentDto = (commentEntity: CommentEntity): CreateCommentDto => {
  return new CreateCommentDto({
    id: commentEntity.get('id'),
    edited: commentEntity.get('edited'),
    parentId: commentEntity.get('parentId'),
    postId: commentEntity.get('postId'),
    totalReply: commentEntity.get('totalReply'),
    content: commentEntity.get('content'),
    giphyId: commentEntity.get('giphyId'),
    giphyUrl: createUrlFromId(commentEntity.get('giphyId')),
    createdAt: commentEntity.get('createdAt'),
    createdBy: commentEntity.get('createdBy'),
    media: {
      files: commentEntity.get('media').files.map((item) => new FileDto(item.toObject())),
      images: commentEntity.get('media').images.map((item) => new ImageDto(item.toObject())),
      videos: commentEntity.get('media').videos.map((item) => new VideoDto(item.toObject())),
    },
    mentions: userMentions
      .filter((mention) => commentEntity.get('mentions').includes(mention.id))
      .reduce((returnValue, current) => {
        return {
          ...returnValue,
          [current.username]: {
            id: current.id,
            fullname: current.fullname,
            email: current.email,
            username: current.username,
            avatar: current.avatar,
          },
        };
      }, {}),
    actor: new UserDto({ ...userMock }),
  });
};
