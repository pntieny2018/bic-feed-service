import { PageDto } from '../../../../common/dto/pagination/page.dto';

export const mockGetTimelineOutput = {
  data: [
    {
      id: 3,
      isDraft: false,
      actor: {
        id: 33,
        username: 'username33',
        fullname: 'User Name 33',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2, 9, 10],
      },
      createdAt: new Date('2022-03-21T20:11:46.887Z'),
      data: {
        content: 'content 2 ...',
        files: [
          {
            id: 26,
            url: 'https://google.com',
            type: 'file',
            isDraft: true,
            createdBy: 1,
            name: 'x3.pdf',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-21T10:48:49.033Z'),
          },
          {
            id: 33,
            url: 'https://google.com',
            type: 'file',
            isDraft: true,
            createdBy: 1,
            name: 'x10.pdf',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-21T10:48:49.033Z'),
          },
        ],
        videos: [],
        images: [],
      },
      audience: {
        groups: [1],
      },
      reactionsCount: {
        '0': {
          huhu: 1,
        },
        '1': {
          love: 3,
        },
      },
      ownerReactions: [],
      commentsCount: 3,
      mentions: [],
      setting: {
        canReact: true,
        canShare: true,
        canComment: true,
        isImportant: false,
        importantExpiredAt: new Date('2024-03-21T19:07:29.322Z'),
      },
    },
    {
      id: 1,
      isDraft: false,
      actor: {
        id: 7,
        username: 'username7',
        fullname: 'User Name 7',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2, 9, 10, 20],
      },
      createdAt: new Date('2022-03-21T17:57:24.641Z'),
      data: {
        content: 'content 0 ...',
        files: [],
        videos: [
          {
            id: 13,
            url: 'https://google.com',
            type: 'video',
            isDraft: true,
            createdBy: 1,
            name: 'x1.mp4',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-21T10:48:49.033Z'),
          },
        ],
        images: [
          {
            id: 2,
            url: 'https://google.com',
            type: 'image',
            isDraft: true,
            createdBy: 1,
            name: 'x1.png',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-21T10:48:49.033Z'),
          },
        ],
      },
      audience: {
        groups: [1, 8, 10],
      },
      reactionsCount: {
        '0': {
          care: 1,
        },
        '1': {
          smile: 1,
        },
        '2': {
          hate: 1,
        },
      },
      ownerReactions: [
        {
          id: 19,
          reactionName: 'hate',
          createdAt: new Date('2022-03-21T16:10:32.140Z'),
        },
      ],
      commentsCount: 2,
      mentions: [
        {
          id: 2,
          username: 'username2',
          fullname: 'User Name 2',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2],
        },
        {
          id: 33,
          username: 'username33',
          fullname: 'User Name 33',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2, 9, 10],
        },
        {
          id: 1,
          username: 'username1',
          fullname: 'User Name 1',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2],
        },
        {
          id: 33,
          username: 'username33',
          fullname: 'User Name 33',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2, 9, 10],
        },
      ],
      setting: {
        canReact: true,
        canShare: true,
        canComment: true,
        isImportant: false,
        importantExpiredAt: new Date('2025-03-21T09:54:53.703Z'),
      },
    },
    {
      id: 5,
      isDraft: false,
      actor: {
        id: 1,
        username: 'username1',
        fullname: 'User Name 1',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2],
      },
      createdAt: new Date('2022-03-21T20:44:08.649Z'),
      data: {
        content: 'content 4 ...',
        files: [
          {
            id: 26,
            url: 'https://google.com',
            type: 'file',
            isDraft: true,
            createdBy: 1,
            name: 'x3.pdf',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-21T10:48:49.033Z'),
          },
        ],
        videos: [
          {
            id: 20,
            url: 'https://google.com',
            type: 'video',
            isDraft: true,
            createdBy: 1,
            name: 'x8.mp4',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-21T10:48:49.033Z'),
          },
        ],
        images: [],
      },
      audience: {
        groups: [1],
      },
      reactionsCount: {
        '0': {
          care: 1,
        },
        '1': {
          smile: 1,
        },
        '2': {
          huhu: 1,
        },
      },
      ownerReactions: [
        {
          id: 5,
          reactionName: 'care',
          createdAt: new Date('2022-03-21T10:48:49.060Z'),
        },
      ],
      commentsCount: 1,
      mentions: [
        {
          id: 33,
          username: 'username33',
          fullname: 'User Name 33',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2, 9, 10],
        },
        {
          id: 2,
          username: 'username2',
          fullname: 'User Name 2',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2],
        },
      ],
      setting: {
        canReact: true,
        canShare: true,
        canComment: true,
        isImportant: false,
        importantExpiredAt: null,
      },
    },
    {
      id: 4,
      isDraft: false,
      actor: {
        id: 7,
        username: 'username7',
        fullname: 'User Name 7',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2, 9, 10, 20],
      },
      createdAt: new Date('2022-03-21T16:05:01.849Z'),
      data: {
        content: 'content 3 ...',
        files: [
          {
            id: 30,
            url: 'https://google.com',
            type: 'file',
            isDraft: true,
            createdBy: 1,
            name: 'x7.pdf',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-21T10:48:49.033Z'),
          },
        ],
        videos: [],
        images: [],
      },
      audience: {
        groups: [1],
      },
      reactionsCount: {
        '0': {
          angry: 1,
        },
        '1': {
          hate: 2,
        },
        '2': {
          care: 1,
        },
      },
      ownerReactions: [
        {
          id: 20,
          reactionName: 'care',
          createdAt: new Date('2022-03-21T16:10:43.066Z'),
        },
      ],
      commentsCount: 3,
      mentions: [
        {
          id: 1,
          username: 'username1',
          fullname: 'User Name 1',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2],
        },
        {
          id: 33,
          username: 'username33',
          fullname: 'User Name 33',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2, 9, 10],
        },
        {
          id: 2,
          username: 'username2',
          fullname: 'User Name 2',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2],
        },
      ],
      setting: {
        canReact: true,
        canShare: true,
        canComment: true,
        isImportant: false,
        importantExpiredAt: null,
      },
    },
    {
      id: 2,
      isDraft: false,
      actor: {
        id: 2,
        username: 'username2',
        fullname: 'User Name 2',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        groups: [1, 2],
      },
      createdAt: new Date('1020-03-21T17:47:55.022Z'),
      data: {
        content: 'content 1 ...',
        files: [],
        videos: [],
        images: [
          {
            id: 3,
            url: 'https://google.com',
            type: 'image',
            isDraft: true,
            createdBy: 1,
            name: 'x2.png',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-21T10:48:49.033Z'),
          },
        ],
      },
      audience: {
        groups: [1, 9],
      },
      reactionsCount: {
        '0': {
          smile: 1,
        },
        '1': {
          love: 3,
        },
      },
      ownerReactions: [
        {
          id: 18,
          reactionName: 'love',
          createdAt: new Date('2022-03-21T16:10:20.274Z'),
        },
      ],
      commentsCount: 1,
      mentions: [
        {
          id: 1,
          username: 'username1',
          fullname: 'User Name 1',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
          groups: [1, 2],
        },
      ],
      setting: {
        canReact: true,
        canShare: true,
        canComment: true,
        isImportant: false,
        importantExpiredAt: new Date('2000-03-21T18:34:21.237Z'),
      },
    },
  ],
  meta: {
    offset: 25,
    limit: 25,
  },
};
