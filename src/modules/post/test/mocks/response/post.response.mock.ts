import { CommentResponseDto } from '../../../../comment/dto/response/comment.response.dto';
import { PageDto } from '../../../../../common/dto/pagination/page.dto';
export const mockedComments: PageDto<CommentResponseDto> = {
  list: [
    {
      ownerReactions: [],
      id: 1,
      totalReply: 0,
      actor: {
        id: 59,
        username: 'aaa',
        avatar: 'aaa',
        fullname: 'aaaaa',
      },
      parentId: 0,
      postId: 1,
      content: 'aaaa',
      createdAt: new Date(),
      updatedAt: new Date(),
      media: {
        videos: [],
        images: [],
        files: [],
      },
      reactionsCount: null,
      child: [
        {
          id: 3,
          actor: {
            id: 1,
            username: 'aaa',
            avatar: 'aaa',
            fullname: 'aaaaa',
          },
          parentId: 1,
          postId: 1,
          content: 'cccc',
          createdAt: new Date(),
          updatedAt: new Date(),
          media: {
            videos: [],
            images: [],
            files: [],
          },
          totalReply: 0,
          reactionsCount: null,
        },
      ],
    },
  ],
  meta: {
    total: 1,
    limit: 1,
  },
};
export const mockedPostResponse = {
  ownerReactions: [],
  id: 1,
  content: 'aaaa',
  media: {
    files: [],
    videos: [],
    images: [
      {
        id: 1,
        name: 'image 0',
        url: 'https://google.com',
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
  isDraft: true,
  actor: {
    id: 59,
    username: 'trangha',
    fullname: 'Hà Phạm Diễm Trang',
  },
  mentions: [
    {
      admin: {
        id: 1,
        username: 'admin',
        fullname: 'Bein Admin 1',
      },
    },
    {
      vinc: {
        id: 2,
        username: 'vinc',
        fullname: 'Nhâm Chấn Vĩ',
      },
    },
  ],
  commentsCount: 0,
  reactionsCount: null,
  createdAt: '2022-04-07T03:46:32.790Z',
  createdBy: 59,
  audience: {
    groups: [],
  },
  comments: mockedComments,
};
