import { CommentResponseDto } from '../../../comment/dto/response/comment.response.dto';
import { PageDto } from '../../../../common/dto/pagination/page.dto';
import { PostResponseDto } from '../../dto/responses';
import { mockedUserAuth } from './user-auth.mock';
export const mockedComments: PageDto<CommentResponseDto> = {
  data: [
    {
      ownerReactions: [],
      id: 1,
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
  content: 'sdfds sdfdsfdf',
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
  actor: mockedUserAuth,
  mentions: [
    {
      aaa: {
        id: 1,
        username: 'aaa',
        fullname: 'aaaaa',
      },
    },
  ],
  commentsCount: 1,
  reactionsCount: null,
  createdAt: new Date(),
  audience: {
    groups: [
      {
        id: 1,
        name: 'aaa',
        icon: 'aaaaa',
      },
    ],
  },
  comments: mockedComments,
};
