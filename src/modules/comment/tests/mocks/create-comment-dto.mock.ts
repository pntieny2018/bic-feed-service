import { userMentionInGroupMock, userMentionNotInGroupMock } from './user.mock';

const createTextCommentDto = {
  postId: '10dc4093-1bd0-4105-869f-8504e1986145',
  content: 'create text comment',
  media: {
    files: [],
    images: [],
    videos: [],
  },
};

const createTextCommentWithMentionInGroupDto = {
  postId: '10dc4093-1bd0-4105-869f-8504e1986145',
  content: 'create text mention comment @bret.josh',
  media: {
    files: [],
    images: [],
    videos: [],
  },
  mentions: [userMentionInGroupMock.id],
};

const createCommentWithPostNotFoundDto = {
  postId: '20dc4093-1bd0-4105-869f-8504e1986145',
  content: 'create text comment',
  media: {
    files: [],
    images: [],
    videos: [],
  },
};

const createMediaNotFoundCommentDto = {
  postId: '10dc4093-1bd0-4105-869f-8504e1986145',
  content: 'hello @caitlyn.back',
  media: {
    files: [
      {
        id: '1a7339bc-5204-4009-9d43-89b6d2787747',
        name: '',
        originName: 'file.txt',
      },
    ],
    images: [
      {
        id: 'ba7339bc-5204-4009-9d43-89b6d2787747',
        name: 'ba7339bc-5204-4009-9d43-89b6d2787747.png',
        originName: 'image.png',
        width: 200,
        height: 200,
      },
    ],
    videos: [
      {
        id: 'ba7339bc-5204-4009-9d43-89b6d2787748',
        name: 'ba7339bc-5204-4009-9d43-89b6d2787748.mp4',
        originName: 'video.mp4',
      },
    ],
  },
};

const createCommentDto = {
  postId: '10dc4093-1bd0-4105-869f-8504e1986145',
  content: 'hello @caitlyn.back',
  media: {
    files: [],
    images: [
      {
        id: 'ba7339bc-5204-4009-9d43-89b6d2787712',
        name: 'ba7339bc-5204-4009-9d43-89b6d2787712.png',
        originName: 'love-is-war.png',
        width: 50,
        height: 50,
      },
    ],
    videos: [],
  },
  mentions: [3],
};

const createTextCommentWithMentionNotInGroupDto = {
  postId: '10dc4093-1bd0-4105-869f-8504e1986145',
  content: 'create text mention comment @caitlyn.back',
  media: {
    files: [],
    images: [],
    videos: [],
  },
  mentions: [userMentionNotInGroupMock.id],
};

export const createdComment = {
  id: '8d8c3656-451a-43ed-9d30-72d6d73489f4',
  totalReply: 0,
  edited: false,
  actor: {
    id: 1,
    fullname: 'Martine Baumbach',
    username: 'martine.baumbach',
    avatar: 'https://bein.group/baumbach.png',
  },
  ownerReactions: null,
  parentId: '00000000-0000-0000-0000-000000000000',
  postId: '20dc4093-1bd0-4105-869f-8504e1986145',
  content: 'hello @caitlyn.back',
  createdAt: new Date(),
  media: {
    images: [
      {
        id: '0cdbe3ad-55b5-4376-ae67-46eefae22374',
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
