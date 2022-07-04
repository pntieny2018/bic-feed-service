/* eslint-disable @typescript-eslint/naming-convention */
export const mockedSearchResponse = {
  body: {
    hits: {
      total: {
        value: 2,
        relation: 'eq',
      },
      max_score: null,
      hits: [
        {
          _index: 'new_feed_test_posts',
          _type: '_doc',
          _id: '26',
          _score: 1.4085433,
          _source: {
            id: 26,
            commentsCount: null,
            content: 'Đây là nó nè, hihi',
            media: {
              videos: [],
              images: [],
              files: [],
            },
            mentions: [
              [
                {
                  id: 1,
                  username: 'aaa',
                  fullname: 'aaaaa',
                },
              ],
              [
                {
                  id: 2,
                  username: 'aaa',
                  fullname: 'aaaaa',
                },
              ],
            ],
            audience: {
              groups: [
                {
                  id: 1,
                  name: 'aaa',
                  icon: 'aaaaa',
                },
              ],
            },
            setting: {
              canReact: false,
              canComment: false,
              canShare: false,
              isImportant: false,
              importantExpiredAt: null,
            },
            createdAt: '2022-03-24T10:22:53.363Z',
            createdBy: 1,
          },
          highlight: {
            'content.text': ['Đây là nó nè, ==hihi=='],
          },
          sort: [1.4085433, 1],
        },
      ],
    },
  },
};
