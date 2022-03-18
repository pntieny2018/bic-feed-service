export const mockGetTimelineOutput = {
  data: [
    {
      id: 2,
      isDraft: false,
      actor: {
        id: 2,
        username: 'username2',
        fullname: 'User Name 2',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
      createdAt: new Date('2022-03-18T20:33:47.226Z'),
      data: {
        content: 'content 1 ...',
        files: [],
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
            createdAt: new Date('2022-03-18T15:02:27.903Z'),
          },
        ],
        images: [
          {
            id: 4,
            url: 'https://google.com',
            type: 'image',
            isDraft: true,
            createdBy: 1,
            name: 'x3.png',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-18T15:02:27.903Z'),
          },
        ],
      },
      audience: { groups: [9, 20] },
      reactionsCount: { '0': { angry: 2 } },
      ownerReactions: [
        {
          id: 5,
          reactionName: 'angry',
          createdAt: new Date('2022-03-18T15:02:27.930Z'),
        },
      ],
      commentCount: 1,
      mentions: [],
      setting: {
        canReact: true,
        canShare: true,
        canComment: true,
        isImportant: false,
        importantExpiredAt: new Date('2025-03-18T09:01:59.810Z'),
      },
    },
    {
      id: 5,
      isDraft: false,
      actor: {
        id: 33,
        username: 'username33',
        fullname: 'User Name 33',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
      createdAt: new Date('2001-03-18T13:56:14.455Z'),
      data: { content: 'content 4 ...', files: [], videos: [], images: [] },
      audience: { groups: [8, 9] },
      reactionsCount: { '0': { angry: 1 }, '1': { care: 1 } },
      ownerReactions: [],
      commentCount: 2,
      mentions: [
        {
          id: 1,
          username: 'username1',
          fullname: 'User Name 1',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        },
        {
          id: 2,
          username: 'username2',
          fullname: 'User Name 2',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        },
      ],
      setting: {
        canReact: true,
        canShare: true,
        canComment: true,
        isImportant: false,
        importantExpiredAt: new Date('2026-03-18T10:34:45.753Z'),
      },
    },
    {
      id: 3,
      isDraft: false,
      actor: {
        id: 2,
        username: 'username2',
        fullname: 'User Name 2',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
      createdAt: new Date('2022-03-19T00:12:22.559Z'),
      data: {
        content: 'content 2 ...',
        files: [],
        videos: [
          {
            id: 22,
            url: 'https://google.com',
            type: 'video',
            isDraft: true,
            createdBy: 1,
            name: 'x10.mp4',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-18T15:02:27.903Z'),
          },
        ],
        images: [],
      },
      audience: { groups: [9] },
      reactionsCount: null,
      ownerReactions: [],
      commentCount: 3,
      mentions: [
        {
          id: 2,
          username: 'username2',
          fullname: 'User Name 2',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        },
        {
          id: 33,
          username: 'username33',
          fullname: 'User Name 33',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        },
        {
          id: 1,
          username: 'username1',
          fullname: 'User Name 1',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
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
        id: 1,
        username: 'username1',
        fullname: 'User Name 1',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
      createdAt: new Date('2022-03-18T15:41:41.634Z'),
      data: {
        content: 'content 3 ...',
        files: [],
        videos: [],
        images: [
          {
            id: 9,
            url: 'https://google.com',
            type: 'image',
            isDraft: true,
            createdBy: 1,
            name: 'x8.png',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-18T15:02:27.903Z'),
          },
        ],
      },
      audience: { groups: [9, 10] },
      reactionsCount: { '0': { smile: 1 } },
      ownerReactions: [
        {
          id: 3,
          reactionName: 'smile',
          createdAt: new Date('2022-03-18T15:02:27.930Z'),
        },
      ],
      commentCount: 4,
      mentions: [
        {
          id: 1,
          username: 'username1',
          fullname: 'User Name 1',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
        },
      ],
      setting: {
        canReact: true,
        canShare: true,
        canComment: true,
        isImportant: false,
        importantExpiredAt: new Date('2022-03-08T11:32:40.424Z'),
      },
    },
    {
      id: 1,
      isDraft: false,
      actor: {
        id: 1,
        username: 'username1',
        fullname: 'User Name 1',
        avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
      },
      createdAt: new Date('2022-03-18T14:24:43.846Z'),
      data: {
        content: 'content 0 ...',
        files: [
          {
            id: 27,
            url: 'https://google.com',
            type: 'file',
            isDraft: true,
            createdBy: 1,
            name: 'x4.pdf',
            originName: null,
            width: null,
            height: null,
            extension: null,
            createdAt: new Date('2022-03-18T15:02:27.903Z'),
          },
        ],
        videos: [],
        images: [],
      },
      audience: { groups: [9, 26, 27] },
      reactionsCount: { '0': { smile: 1 } },
      ownerReactions: [],
      commentCount: 0,
      mentions: [
        {
          id: 2,
          username: 'username2',
          fullname: 'User Name 2',
          avatar: 'https://docs.nestjs.com/assets/logo-small.svg',
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
  ],
  meta: { offset: 20, limit: 20 },
};
