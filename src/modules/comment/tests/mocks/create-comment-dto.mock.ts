import { CreateCommentDto } from '../../dto/requests';
import { actorComment, userMentionInGroupMock, userMentionNotInGroupMock } from './user.mock';

const createTextCommentDto: CreateCommentDto = {
  postId: 1,
  data: {
    content: 'create text comment',
    files: [],
    images: [],
    videos: [],
  },
};

const createTextCommentWithMentionInGroupDto: CreateCommentDto = {
  postId: 1,
  data: {
    content: 'create text mention comment @bret.josh',
    files: [],
    images: [],
    videos: [],
  },
  mentions: [userMentionInGroupMock],
};

const createCommentWithPostNotFoundDto: CreateCommentDto = {
  postId: 2,
  data: {
    content: 'create text comment',
    files: [],
    images: [],
    videos: [],
  },
};

const createMediaNotFoundCommentDto: CreateCommentDto = {
  postId: 1,
  data: {
    content: 'hello @caitlyn.back',
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
  data: {
    content: 'hello @caitlyn.back',
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
  data: {
    content: 'create text mention comment @caitlyn.back',
    files: [],
    images: [],
    videos: [],
  },
  mentions: [userMentionNotInGroupMock],
};

export const createdComment = {
  id: 1,
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
  media: [
    {
      id: 1,
      createdBy: 1,
      url: 'https://photo.com/ba7339bc-5204-4009-9d43-89b6d2787747.png',
      type: 'image',
      createdAt: new Date(),
      name: 'ba7339bc-5204-4009-9d43-89b6d2787747.png',
      originName: 'love-is-war.png',
      width: 50,
      height: 50,
      extension: 'image/png',
    },
  ],
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
