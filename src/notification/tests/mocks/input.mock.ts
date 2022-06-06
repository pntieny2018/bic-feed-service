import { MentionableType } from '../../../common/constants';
import { ObjectHelper } from '../../../common/helpers';
import { PostPrivacy } from '../../../database/models/post.model';
import { UserDto } from '../../../modules/auth';
import { PostResponseDto } from '../../../modules/post/dto/responses';
import { GroupPrivacy } from '../../../shared/group/dto';
import { NIL } from 'uuid';

export const mockUserSharedDto = {
  id: 20,
  username: 'vantt',
  fullname: 'Than The Van',
  avatar: 'http://google.com/vantt.png',
  groups: [1, 2, 3],
  email: 'vantt@tgm.vn',
};

export const mockNotificationPayloadDto = {
  key: 'something',
  value: {
    actor: mockUserSharedDto,
    event: 'event-name',
    data: null,
  },
};

export const mockPostResponseDto: PostResponseDto = {
  id: '40dc4093-1bd0-4105-469f-8504e1986145',
  content: 'hello world',
  highlight: 'nothing',
  isArticle: false,
  media: {
    files: [],
    videos: [],
    images: [],
  },
  setting: {
    canReact: true,
    canComment: true,
    isImportant: false,
    importantExpiredAt: null,
  },
  isDraft: false,
  isProcessing: false,
  actor: mockUserSharedDto,
  mentions: {},
  commentsCount: 0,
  privacy: PostPrivacy.PUBLIC,
  reactionsCount: {
    [1]: {
      haha: 100,
    },
  },
  markedReadPost: false,
  createdAt: new Date('2022-05-19T02:53:48.135Z'),
  updatedAt: null,
  createdBy: mockUserSharedDto.id,
  audience: {
    groups: [
      {
        id: 1,
        name: 'Bein Community',
        icon: 'http://bein.com/bein.png',
        privacy: GroupPrivacy.OPEN,
      },
    ],
  },
  ownerReactions: [],
  comments: null,
};

export const mockUserDto: UserDto = {
  username: 'vuquang23',
  email: 'vuquang@tgm.vn',
  avatar: 'https://google.com/vuquang.png',
  id: 33,
  profile: {
    id: 33,
    username: 'vuquang23',
    fullname: 'Vu Quang Le',
    avatar: 'https://google.com/vuquang.png',
    email: 'vuquang@tgm.vn',
    groups: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },
};

export const mockReactionResponseDto = {
  actor: {
    ...mockUserSharedDto,
  },
  id: '100',
  reactionName: 'smile',
  createdAt: new Date(0),
};

export const mockCommentResponseDto = {
  id: '99',
  actor: mockUserSharedDto,
  edited: false,
  parentId: NIL,
  postId: mockPostResponseDto.id,
  totalReply: 0,
  ownerReactions: [],
  reactionsCount: {
    [1]: {
      haha: 100,
    },
  },
};

export const mockCommentResponseWithParentDto = {
  id: '100',
  actor: mockUserSharedDto,
  edited: false,
  parentId: mockCommentResponseDto.id,
  parent: { ...mockCommentResponseDto },
  postId: mockPostResponseDto.id,
  totalReply: 0,
  ownerReactions: [],
};

export const mockCommentModel = {
  id: mockCommentResponseDto.id,
  actor: mockUserSharedDto,
  postId: mockPostResponseDto.id,
  createdBy: mockUserSharedDto.id,
  updatedBy: mockUserSharedDto.id,
  mentions: [
    {
      id: '1000',
      mentionableType: MentionableType.COMMENT,
      entityId: mockCommentResponseDto.id,
      userId: 99,
    },
  ],
  child: [
    {
      id: mockCommentResponseDto.id + 100,
      actor: mockUserSharedDto,
      postId: mockPostResponseDto.id,
      createdBy: mockUserSharedDto.id,
      updatedBy: mockUserSharedDto.id,
      mentions: [
        {
          id: 1001,
          mentionableType: MentionableType.COMMENT,
          entityId: mockCommentResponseDto.id,
          userId: 100,
        },
      ],
    },
    {
      id: mockCommentResponseDto.id + 101,
      actor: mockUserSharedDto,
      postId: mockPostResponseDto.id,
      createdBy: mockUserSharedDto.id,
      updatedBy: mockUserSharedDto.id,
      mentions: [
        {
          id: 1002,
          mentionableType: MentionableType.COMMENT,
          entityId: mockCommentResponseDto.id,
          userId: 101,
        },
      ],
    },
  ],
  toJSON: () => ({
    id: mockCommentResponseDto.id,
    actor: mockUserSharedDto,
    postId: mockPostResponseDto.id,
    createdBy: mockUserSharedDto.id,
    updatedBy: mockUserSharedDto.id,
    mentions: [
      {
        id: 1000,
        mentionableType: MentionableType.COMMENT,
        entityId: mockCommentResponseDto.id,
        userId: 99,
      },
    ],
    child: [
      {
        id: mockCommentResponseDto.id + 100,
        actor: mockUserSharedDto,
        postId: mockPostResponseDto.id,
        createdBy: mockUserSharedDto.id,
        updatedBy: mockUserSharedDto.id,
        mentions: [
          {
            id: 1001,
            mentionableType: MentionableType.COMMENT,
            entityId: mockCommentResponseDto.id,
            userId: 100,
          },
        ],
      },
      {
        id: mockCommentResponseDto.id + 101,
        actor: mockUserSharedDto,
        postId: mockPostResponseDto.id,
        createdBy: mockUserSharedDto.id,
        updatedBy: mockUserSharedDto.id,
        mentions: [
          {
            id: 1002,
            mentionableType: MentionableType.COMMENT,
            entityId: mockCommentResponseDto.id,
            userId: 101,
          },
        ],
      },
    ],
  }),
};

export const mockValidUserIds = [99, 100, 101, 102, 20];
