import { CreateCommentDto } from '../../dto/requests';
import { actorComment, userMentionInGroupMock, userMentionNotInGroupMock } from './user.mock';
import { CommentResponseDto } from '../../dto/response/comment.response.dto';

const createTextCommentDto: CreateCommentDto = {
  postId: 1,
  content: 'create text comment',
  media: {
    files: [],
    images: [],
    videos: [],
  },
};

const createTextCommentWithMentionInGroupDto: CreateCommentDto = {
  postId: 1,
  content: 'create text mention comment @bret.josh',
  media: {
    files: [],
    images: [],
    videos: [],
  },
  mentions: [userMentionInGroupMock],
};

const createCommentWithPostNotFoundDto: CreateCommentDto = {
  postId: 2,
  content: 'create text comment',
  media: {
    files: [],
    images: [],
    videos: [],
  },
};

const createMediaNotFoundCommentDto: CreateCommentDto = {
  postId: 1,
  content: 'hello @caitlyn.back',
  media: {
    files: [
      {
        id: 1,
        name: '',
        originName: 'file.txt',
      },
    ],
    images: [
      {
        id: 2,
        name: 'ba7339bc-5204-4009-9d43-89b6d2787747.png',
        originName: 'image.png',
        width: 200,
        height: 200,
      },
    ],
    videos: [
      {
        id: 3,
        name: 'ba7339bc-5204-4009-9d43-89b6d2787747.mp4',
        originName: 'video.mp4',
      },
    ],
  },
};

const createCommentDto: CreateCommentDto = {
  postId: 1,
  content: 'hello @caitlyn.back',
  media: {
    files: [],
    images: [
      {
        id: 1,
        name: 'ba7339bc-5204-4009-9d43-89b6d2787747.png',
        originName: 'love-is-war.png',
        width: 50,
        height: 50,
      },
    ],
    videos: [],
  },
  mentions: [
    {
      id: 3,
      fullname: 'Caitlyn Back',
      username: 'caitlyn.back',
      avatar: 'https://bein.group/back.png',
    },
  ],
};

const createTextCommentWithMentionNotInGroupDto: CreateCommentDto = {
  postId: 1,
  content: 'create text mention comment @caitlyn.back',
  media: {
    files: [],
    images: [],
    videos: [],
  },
  mentions: [userMentionNotInGroupMock],
};

export const createdComment: CommentResponseDto = {
  id: 1,
  totalReply: 0,
  actor: {
    id: 1,
    fullname: 'Martine Baumbach',
    username: 'martine.baumbach',
    avatar: 'https://bein.group/baumbach.png',
  },
  parentId: 0,
  postId: 2,
  content: 'hello @caitlyn.back',
  createdAt: new Date(),
  media: {
    images: [
      {
        id: 1,
        url: 'https://photo.com/ba7339bc-5204-4009-9d43-89b6d2787747.png',
        name: 'ba7339bc-5204-4009-9d43-89b6d2787747.png',
        originName: 'love-is-war.png',
        width: 50,
        height: 50,
      },
    ],
    videos: [],
    files: [],
  },
  reactionsCount: {},
  mentions: {
    ['caitlyn.back']: {
      id: 3,
      fullname: 'Caitlyn Back',
      username: 'caitlyn.back',
      avatar: 'https://bein.group/back.png',
    },
  },
  child: [],
};

export {
  createTextCommentDto,
  createTextCommentWithMentionInGroupDto,
  createCommentWithPostNotFoundDto,
  createCommentDto,
  createMediaNotFoundCommentDto,
  createTextCommentWithMentionNotInGroupDto,
};
