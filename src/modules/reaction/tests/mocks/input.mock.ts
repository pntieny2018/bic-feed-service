import { OrderEnum } from '../../../../common/dto';
import { ObjectHelper } from '../../../../common/helpers';
import { GroupPrivacy } from '../../../../shared/group/dto';
import { UserDto } from '../../../auth';
import { CommentResponseDto } from '../../../comment/dto/response';
import { PostResponseDto } from '../../../post/dto/responses';
import { ReactionEnum } from '../../reaction.enum';

export const mockCreateReactionDto = {
  post: {
    reactionName: 'smile',
    target: ReactionEnum.POST,
    targetId: '40dc4093-1bd0-4105-869f-8504e1986142',
  },
  comment: {
    reactionName: 'sad',
    target: ReactionEnum.COMMENT,
    targetId: '40dc4093-1bd0-4105-869f-8504e1986143',
  },
};

export const mockReactionDto = {
  userId: 33,
  reactionId: 1,
  target: ReactionEnum.POST,
  targetId: 9,
  reactionName: 'smile',
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

export const mockUserSharedDto = {
  id: 20,
  username: 'vantt',
  fullname: 'Than The Van',
  avatar: 'http://google.com/vantt.png',
  groups: [1, 2, 3],
};

export const mockPostResponseDto: PostResponseDto = {
  id: mockCreateReactionDto.post.targetId,
  content: 'hello world',
  highlight: 'nothing',
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
  reactionsCount: {},
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

export const mockCreatePostReactionProcedureReturn = [
  {
    ['cpr_id']: 99,
  },
];

export const mockCreateCommentReactionProcedureReturn = [
  {
    ['ccr_id']: 100,
  },
];

export const mockPostReactionModel = {
  id: mockCreatePostReactionProcedureReturn[0]['cpr_id'],
  postId: mockCreateReactionDto.post.targetId,
  reactionName: mockCreateReactionDto.post.reactionName,
  createdBy: mockUserDto.id,
  createdAt: new Date('2022-05-19T02:53:48.135Z'),
  toJSON: () => {
    return {
      id: mockCreatePostReactionProcedureReturn[0]['cpr_id'],
      postId: mockCreateReactionDto.post.targetId,
      reactionName: mockCreateReactionDto.post.reactionName,
      createdBy: mockUserDto.id,
      createdAt: new Date('2022-05-19T02:53:48.135Z'),
    };
  },
};

export const mockCommentReactionModel = {
  id: mockCreateCommentReactionProcedureReturn[0]['ccr_id'],
  commentId: mockCreateReactionDto.comment.targetId,
  reactionName: mockCreateReactionDto.comment.reactionName,
  createdBy: mockUserDto.id,
  createdAt: new Date('2022-05-19T02:53:48.135Z'),
  toJSON: () => {
    return {
      id: mockCreateCommentReactionProcedureReturn[0]['ccr_id'],
      commentId: mockCreateReactionDto.comment.targetId,
      reactionName: mockCreateReactionDto.comment.reactionName,
      createdBy: mockUserDto.id,
      createdAt: new Date('2022-05-19T02:53:48.135Z'),
    };
  },
};

export const mockReactionResponseDto = {
  post: {
    actor: {
      ...ObjectHelper.omit(['groups'], mockUserDto.profile),
      email: mockUserDto.email,
    },
    id: mockPostReactionModel.id,
    reactionName: mockPostReactionModel.reactionName,
    createdAt: mockPostReactionModel.createdAt,
  },
  comment: {
    actor: {
      ...ObjectHelper.omit(['groups'], mockUserDto.profile),
      email: mockUserDto.email,
    },
    id: mockCommentReactionModel.id,
    reactionName: mockCommentReactionModel.reactionName,
    createdAt: mockCommentReactionModel.createdAt,
  },
};

export const mockCommentResponseDto: CommentResponseDto = {
  id: mockCreateReactionDto.comment.targetId,
  actor: mockUserSharedDto,
  edited: false,
  parentId: null,
  postId: mockPostResponseDto.id,
  totalReply: 0,
  ownerReactions: [],
};

export const mockDeleteReactionDto = {
  post: {
    target: ReactionEnum.POST,
    targetId: mockCreateReactionDto.post.targetId,
    reactionName: mockCreateReactionDto.post.reactionName,
    reactionId: mockCreatePostReactionProcedureReturn[0]['cpr_id'],
  },
  comment: {
    target: ReactionEnum.COMMENT,
    targetId: mockCreateReactionDto.comment.targetId,
    reactionName: mockCreateReactionDto.comment.reactionName,
    reactionId: mockCreateCommentReactionProcedureReturn[0]['ccr_id'],
  },
};

export const mockIPostReaction = {
  id: mockCreatePostReactionProcedureReturn[0]['cpr_id'],
  postId: mockCreateReactionDto.post.targetId,
  reactionName: mockCreateReactionDto.post.reactionName,
  createdBy: mockUserDto.id,
  createdAt: new Date('2022-05-19T02:53:48.135Z'),
};

export const mockICommentReaction = {
  id: mockCreateCommentReactionProcedureReturn[0]['ccr_id'],
  commentId: mockCreateReactionDto.comment.targetId,
  reactionName: mockCreateReactionDto.comment.reactionName,
  createdBy: mockUserDto.id,
  createdAt: new Date('2022-05-19T02:53:48.135Z'),
};

export const mockGetReactionDto = {
  post: {
    reactionName: mockCreateReactionDto.post.reactionName,
    targetId: mockPostResponseDto.id,
    target: ReactionEnum.POST,
    latestId: 0,
    limit: 1,
    order: OrderEnum.ASC,
  },
  comment: {
    reactionName: mockCreateReactionDto.comment.reactionName,
    targetId: mockCommentResponseDto.id,
    target: ReactionEnum.COMMENT,
    latestId: 0,
    limit: 1,
    order: OrderEnum.ASC,
  },
};

export const mockPostReactionModels = [mockPostReactionModel];

export const mockCommentReactionModels = [mockCommentReactionModel];

export const mockReactionResponseDtos = {
  post: [
    {
      id: mockCreatePostReactionProcedureReturn[0]['cpr_id'],
      actor: {
        ...ObjectHelper.omit(['groups'], mockUserDto.profile),
        email: mockUserDto.email,
      },
      reactionName: mockCreateReactionDto.post.reactionName,
      createdAt: new Date('2022-05-19T02:53:48.135Z'),
    },
  ],
  comment: [
    {
      id: mockCreateCommentReactionProcedureReturn[0]['ccr_id'],
      actor: {
        ...ObjectHelper.omit(['groups'], mockUserDto.profile),
        email: mockUserDto.email,
      },
      reactionName: mockCreateReactionDto.comment.reactionName,
      createdAt: new Date('2022-05-19T02:53:48.135Z'),
    },
  ],
};

export const mockReactionsResponseDto = {
  post: {
    order: mockGetReactionDto.post.order,
    list: [mockReactionResponseDto.post],
    limit: mockGetReactionDto.post.limit,
    latestId: mockCreatePostReactionProcedureReturn[0]['cpr_id'],
  },
  comment: {
    list: [mockReactionResponseDto.comment],
    limit: 1,
    latestId: mockCreateCommentReactionProcedureReturn[0]['ccr_id'],
  },
};
