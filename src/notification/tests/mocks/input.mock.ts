import { MentionableType } from '../../../common/constants';
import { ObjectHelper } from '../../../common/helpers';
import { PostPrivacy, PostType } from '../../../database/models/post.model';
import { UserDto } from '../../../modules/auth';
import { PostResponseDto } from '../../../modules/post/dto/responses';
import { GroupPrivacy } from '../../../shared/group/dto';
import { NIL } from 'uuid';

export const mockUserSharedDto = {
  id: '36d66fb6-5a24-4fb4-892e-1c38760da774',
  username: 'vantt',
  fullname: 'Than The Van',
  avatar: 'http://google.com/vantt.png',
  groups: [
    '36d66fb6-5a24-4fb4-892e-1c38760da774',
    '36d66fb6-5a24-4fb4-892e-1c38760da775',
    '36d66fb6-5a24-4fb4-892e-1c38760da776',
  ],
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
  type: PostType.POST,
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
  totalUsersSeen: 0,
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
        id: '36d66fb6-5a24-4fb4-892e-1c38760da777',
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
  id: '36d66fb6-5a24-4fb4-892e-1c38760da778',
  profile: {
    id: '36d66fb6-5a24-4fb4-892e-1c38760da779',
    username: 'vuquang23',
    fullname: 'Vu Quang Le',
    avatar: 'https://google.com/vuquang.png',
    email: 'vuquang@tgm.vn',
    groups: [
      '36d66fb6-5a24-4fb4-892e-1c38760da770',
      '36d66fb6-5a24-4fb4-892e-1c38760da771',
      '36d66fb6-5a24-4fb4-892e-1c38760da772',
      '36d66fb6-5a24-4fb4-892e-1c38760da773',
    ],
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

export const mockValidUserIds = [
  '88a3a95a-5fd4-4e59-96e3-4d1610fd771c',
  '88a3a95a-5fd4-4e59-96e3-4d1610fd771b',
  '88a3a95a-5fd4-4e59-96e3-4d1610fd771a',
  '88a3a95a-5fd4-4e59-96e3-4d1610fd771d',
  '88a3a95a-5fd4-4e59-96e3-4d1610fd771e',
];
