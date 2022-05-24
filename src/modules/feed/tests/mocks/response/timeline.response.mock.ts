export const mockTimelineResponse = {
  list: [
    {
      ownerReactions: [],
      id: 5000015,
      content: 'aaaaaaa',
      media: {
        files: [],
        videos: [],
        images: [
          {
            id: 1,
            name: 'Filename.jpg',
            url: 'http://google.com/....',
            width: null,
            height: null,
          },
        ],
      },
      setting: {
        canReact: true,
        canComment: true,
        canShare: true,
        isImportant: false,
        importantExpiredAt: null,
      },
      isDraft: false,
      actor: {
        id: 15,
        username: 'trangha',
        fullname: 'Hà Phạm Diễm Trang',
        avatar:
          'https://s3.amazonaws.com/hrpartner/3hHQzQLEwIQgJ43broUzUA/employee/52134/Di%E1%BB%85m%20Trang.jpg',
      },
      mentions: {
        admin: {
          id: 1,
          username: 'admin',
          fullname: 'Bein Admin 1',
          avatar: 'https://cdn.dribbble.com/users/81809/screenshots/3460815/piccolo.jpg',
        },
      },
      commentsCount: 0,
      reactionsCount: {},
      markedReadPost: false,
      createdAt: '2022-04-20T06:47:16.975Z',
      updatedAt: '2022-04-20T06:47:16.975Z',
      createdBy: 15,
      audience: {
        groups: [
          {
            id: 1,
            name: 'EVOL Community',
            icon: 'https://cdn.dribbble.com/users/183984/screenshots/2562247/pokemon.jpg',
            privacy: 'open',
          },
          {
            id: 6,
            name: 'Bein Community',
            icon: 'https://cdn.dribbble.com/users/183984/screenshots/2562247/pokemon.jpg',
            privacy: 'open',
          },
        ],
      },
    },
    {
      ownerReactions: [],
      id: 5000014,
      content: 'sdfsdf',
      media: {
        videos: [],
        images: [],
        files: [],
      },
      setting: {
        canReact: true,
        canComment: true,
        canShare: true,
        isImportant: false,
        importantExpiredAt: null,
      },
      isDraft: false,
      actor: {
        id: 15,
        username: 'trangha',
        fullname: 'Hà Phạm Diễm Trang',
        avatar:
          'https://s3.amazonaws.com/hrpartner/3hHQzQLEwIQgJ43broUzUA/employee/52134/Di%E1%BB%85m%20Trang.jpg',
      },
      mentions: {
        vinc: {
          id: 2,
          username: 'vinc',
          fullname: 'Nhâm Chấn Vĩ',
          avatar:
            'https://s3.amazonaws.com/hrpartner/3hHQzQLEwIQgJ43broUzUA/employee/65731/NCV.jpg',
        },
      },
      commentsCount: 0,
      reactionsCount: {},
      markedReadPost: false,
      createdAt: '2022-04-20T06:45:11.553Z',
      updatedAt: '2022-04-20T06:45:35.898Z',
      createdBy: 15,
      audience: {
        groups: [
          {
            id: 1,
            name: 'EVOL Community',
            icon: 'https://cdn.dribbble.com/users/183984/screenshots/2562247/pokemon.jpg',
            privacy: 'open',
          },
          {
            id: 6,
            name: 'Bein Community',
            icon: 'https://cdn.dribbble.com/users/183984/screenshots/2562247/pokemon.jpg',
            privacy: 'open',
          },
        ],
      },
    },
  ],
  meta: {
    limit: 5,
    offset: 0,
    hasNextPage: true,
  },
};
