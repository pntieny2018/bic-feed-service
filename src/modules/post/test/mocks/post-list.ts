import { UpdatedAt } from 'sequelize-typescript';
import { IPost, PostModel } from 'src/database/models/post.model';
import { CreatePostDto } from '../../dto/requests';

export const mockedCreatePostDto: CreatePostDto = {
  data: {
    content: 'aaaa',
    files: [
      {
        id: 1,
      },
    ],
    images: [],
    videos: [],
  },
  setting: {
    canReact: true,
    canComment: true,
    canShare: true,
    isImportant: false,
    importantExpiredAt: null,
  },
  mentions: [
    {
      id: 1,
      username: 'abcd',
      fullname: 'abcd',
      avatar: 'asdfsdf',
      groups: [1],
    },
  ],
  audience: {
    groups: [
      {
        id: 1,
        name: 'abcd',
        icon: 'aaaa',
      },
    ],
  },
  isDraft: false,
};

export const mockedUpdatePostDto: CreatePostDto = {
  data: {
    content: 'bbb',
    files: [],
    images: [],
    videos: [],
  },
  setting: {
    canReact: false,
    canComment: true,
    canShare: true,
    isImportant: false,
    importantExpiredAt: null,
  },
  mentions: [
    {
      id: 1,
      username: 'abcd',
      fullname: 'abcd',
      avatar: 'asdfsdf',
      groups: [1],
    },
  ],
  audience: {
    groups: [
      {
        id: 1,
        name: 'abcd',
        icon: 'aaaa',
      },
    ],
  },
  isDraft: false,
};

export const mockedPostList: IPost[] = [
  {
    id: 1,
    createdBy: 1,
    updatedBy: 1,
    isImportant: true,
    commentsCount: 0,
    importantExpiredAt: new Date(),
    canShare: true,
    canReact: true,
    canComment: true,
    content: 'aaaa',
    isDraft: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    createdBy: 1,
    updatedBy: 1,
    commentsCount: 1,
    isImportant: false,
    importantExpiredAt: null,
    canShare: true,
    canReact: true,
    canComment: true,
    content: 'bbbb',
    isDraft: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
