import { CreateCommentDto } from '../../dto/requests';
import { userMentionInGroupMock, userMentionNotInGroupMock } from './user.mock';

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

const createMediaCommentDto: CreateCommentDto = {
  postId: 1,
  data: {
    content: 'create media comment',
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

const createMediaNotFoundCommentDto: CreateCommentDto = {
  postId: 1,
  data: {
    content: 'create media not found comment',
    files: [
      {
        id: 4,
        name: '',
        originName: 'file.txt',
      },
    ],
    images: [
      {
        id: 5,
        name: 'ba7339bc-5204-4009-9d43-89b6d2787747.png',
        originName: 'image.png',
        width: 200,
        height: 200,
      },
    ],
    videos: [
      {
        id: 6,
        name: 'ba7339bc-5204-4009-9d43-89b6d2787747.mp4',
        originName: 'video.mp4',
      },
    ],
  },
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

export {
  createTextCommentDto,
  createTextCommentWithMentionInGroupDto,
  createCommentWithPostNotFoundDto,
  createMediaCommentDto,
  createMediaNotFoundCommentDto,
  createTextCommentWithMentionNotInGroupDto,
};
