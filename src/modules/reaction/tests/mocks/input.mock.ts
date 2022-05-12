import { OrderEnum } from '../../../../common/dto';
import { UserDto } from '../../../auth';
import { ReactionDto } from '../../dto/reaction.dto';
import { CreateReactionDto, DeleteReactionDto, GetReactionDto } from '../../dto/request';
import { ReactionEnum } from '../../reaction.enum';

export const mockCreateReactionDto = [
  {
    reactionName: 'smile',
    target: ReactionEnum.POST,
    targetId: 9,
  },
  {
    reactionName: 'sad',
    target: ReactionEnum.COMMENT,
    targetId: 89,
  },
];

export const mockReactionDto = {
  userId: 33,
  reactionId: 1,
  target: ReactionEnum.POST,
  targetId: 9,
  reactionName: 'smile',
};

export const mockDeleteReactionDto = [
  {
    target: ReactionEnum.POST,
    reactionId: 1,
    targetId: 0,
  },
  {
    target: ReactionEnum.COMMENT,
    reactionId: 2,
    targetId: 0,
  },
];

export const mockUserDto: UserDto = {
  id: 33,
};

export const mockGetReactionDto: GetReactionDto = {
  reactionName: 'smile',
  targetId: 9,
  target: ReactionEnum.POST,
  latestId: 1,
  limit: 25,
  order: OrderEnum.ASC,
};

export const mockPostReactionModelFindOne = {
  id: 1,
  postId: 5,
  reactionName: 'smile',
  createdBy: mockUserDto.id,
};

export const mockCommentReactionModelFindOne = {
  id: 2,
  commentId: 5,
  reactionName: 'smile',
  createdBy: mockUserDto.id,
};

export const mockComment = {
  id: 89,
  postId: 9,
  parentId: 1,
  content: 'huhu viet test nhieu qua :(',
  createdBy: 33,
  updatedBy: 33,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockPostCanReact = {
  id: 9,
  createdBy: 33,
  updatedBy: 33,
  content: 'haha',
  isImportant: true,
  importantExpiredAt: new Date(),
  isDraft: false,
  canReact: true,
  canShare: true,
  canComment: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  comments: [],
  media: [],
};

export const mockPostCannotReact = {
  id: 9,
  createdBy: 33,
  updatedBy: 33,
  content: 'haha',
  isImportant: true,
  importantExpiredAt: new Date(),
  isDraft: false,
  canReact: false,
  canShare: true,
  canComment: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  comments: [],
  media: [],
};

export const mockPostSmileReaction = [
  { toJSON: () => ({ id: 1, postId: 9, reactionName: 'smile', createdBy: 33 }) },
];

export const mockCommentSmileReaction = [
  { toJSON: () => ({ id: 1, postId: 9, reactionName: 'smile', createdBy: 33 }) },
];

export const mock15ReactionOnAPost = [
  { id: 1, postId: 9, reactionName: 'reactionName1', createdBy: 3 },
  { id: 2, postId: 9, reactionName: 'reactionName2', createdBy: 31 },
  { id: 3, postId: 9, reactionName: 'reactionName3', createdBy: 79 },
  { id: 4, postId: 9, reactionName: 'reactionName4', createdBy: 57 },
  { id: 5, postId: 9, reactionName: 'reactionName5', createdBy: 98 },
  { id: 6, postId: 9, reactionName: 'reactionName6', createdBy: 9 },
  { id: 7, postId: 9, reactionName: 'reactionName7', createdBy: 28 },
  { id: 8, postId: 9, reactionName: 'reactionName8', createdBy: 11 },
  { id: 9, postId: 9, reactionName: 'reactionName9', createdBy: 67 },
  { id: 10, postId: 9, reactionName: 'reactionName10', createdBy: 70 },
  { id: 11, postId: 9, reactionName: 'reactionName11', createdBy: 50 },
  { id: 12, postId: 9, reactionName: 'reactionName12', createdBy: 62 },
  { id: 13, postId: 9, reactionName: 'reactionName13', createdBy: 42 },
  { id: 14, postId: 9, reactionName: 'reactionName14', createdBy: 111 },
  { id: 15, postId: 9, reactionName: 'reactionName15', createdBy: 18 },
];

export const mock21ReactionOnAPost = [
  { id: 1, postId: 9, reactionName: 'reactionName1', createdBy: 97 },
  { id: 2, postId: 9, reactionName: 'reactionName2', createdBy: 50 },
  { id: 3, postId: 9, reactionName: 'reactionName3', createdBy: 39 },
  { id: 4, postId: 9, reactionName: 'reactionName4', createdBy: 55 },
  { id: 5, postId: 9, reactionName: 'reactionName5', createdBy: 77 },
  { id: 6, postId: 9, reactionName: 'reactionName6', createdBy: 9 },
  { id: 7, postId: 9, reactionName: 'reactionName7', createdBy: 54 },
  { id: 8, postId: 9, reactionName: 'reactionName8', createdBy: 18 },
  { id: 9, postId: 9, reactionName: 'reactionName9', createdBy: 83 },
  { id: 10, postId: 9, reactionName: 'reactionName10', createdBy: 50 },
  { id: 11, postId: 9, reactionName: 'reactionName11', createdBy: 88 },
  { id: 12, postId: 9, reactionName: 'reactionName12', createdBy: 63 },
  { id: 13, postId: 9, reactionName: 'reactionName13', createdBy: 103 },
  { id: 14, postId: 9, reactionName: 'reactionName14', createdBy: 108 },
  { id: 15, postId: 9, reactionName: 'reactionName15', createdBy: 109 },
  { id: 16, postId: 9, reactionName: 'reactionName16', createdBy: 59 },
  { id: 17, postId: 9, reactionName: 'reactionName17', createdBy: 105 },
  { id: 18, postId: 9, reactionName: 'reactionName18', createdBy: 60 },
  { id: 19, postId: 9, reactionName: 'reactionName19', createdBy: 72 },
  { id: 20, postId: 9, reactionName: 'reactionName20', createdBy: 52 },
  { id: 21, postId: 9, reactionName: 'reactionName21', createdBy: 104 },
];

export const mock21ReactionOnAComment = [
  { id: 1, commentId: 89, reactionName: 'reactionName1', createdBy: 6 },
  { id: 2, commentId: 89, reactionName: 'reactionName2', createdBy: 95 },
  { id: 3, commentId: 89, reactionName: 'reactionName3', createdBy: 73 },
  { id: 4, commentId: 89, reactionName: 'reactionName4', createdBy: 62 },
  { id: 5, commentId: 89, reactionName: 'reactionName5', createdBy: 103 },
  { id: 6, commentId: 89, reactionName: 'reactionName6', createdBy: 12 },
  { id: 7, commentId: 89, reactionName: 'reactionName7', createdBy: 63 },
  { id: 8, commentId: 89, reactionName: 'reactionName8', createdBy: 91 },
  { id: 9, commentId: 89, reactionName: 'reactionName9', createdBy: 39 },
  { id: 10, commentId: 89, reactionName: 'reactionName10', createdBy: 48 },
  { id: 11, commentId: 89, reactionName: 'reactionName11', createdBy: 43 },
  { id: 12, commentId: 89, reactionName: 'reactionName12', createdBy: 36 },
  { id: 13, commentId: 89, reactionName: 'reactionName13', createdBy: 91 },
  { id: 14, commentId: 89, reactionName: 'reactionName14', createdBy: 51 },
  { id: 15, commentId: 89, reactionName: 'reactionName15', createdBy: 92 },
  { id: 16, commentId: 89, reactionName: 'reactionName16', createdBy: 26 },
  { id: 17, commentId: 89, reactionName: 'reactionName17', createdBy: 26 },
  { id: 18, commentId: 89, reactionName: 'reactionName18', createdBy: 104 },
  { id: 19, commentId: 89, reactionName: 'reactionName19', createdBy: 93 },
  { id: 20, commentId: 89, reactionName: 'reactionName20', createdBy: 25 },
  { id: 21, commentId: 89, reactionName: 'reactionName21', createdBy: 27 },
];

export const mock15ReactionOnAComment = [
  { id: 1, commentId: 89, reactionName: 'reactionName1', createdBy: 37 },
  { id: 2, commentId: 89, reactionName: 'reactionName2', createdBy: 19 },
  { id: 3, commentId: 89, reactionName: 'reactionName3', createdBy: 78 },
  { id: 4, commentId: 89, reactionName: 'reactionName4', createdBy: 61 },
  { id: 5, commentId: 89, reactionName: 'reactionName5', createdBy: 62 },
  { id: 6, commentId: 89, reactionName: 'reactionName6', createdBy: 14 },
  { id: 7, commentId: 89, reactionName: 'reactionName7', createdBy: 63 },
  { id: 8, commentId: 89, reactionName: 'reactionName8', createdBy: 104 },
  { id: 9, commentId: 89, reactionName: 'reactionName9', createdBy: 70 },
  { id: 10, commentId: 89, reactionName: 'reactionName10', createdBy: 78 },
  { id: 11, commentId: 89, reactionName: 'reactionName11', createdBy: 40 },
  { id: 12, commentId: 89, reactionName: 'reactionName12', createdBy: 35 },
  { id: 13, commentId: 89, reactionName: 'reactionName13', createdBy: 69 },
  { id: 14, commentId: 89, reactionName: 'reactionName14', createdBy: 66 },
  { id: 15, commentId: 89, reactionName: 'reactionName15', createdBy: 97 },
];

export const mockPostGroup = [
  {
    postId: 9,
    groupId: 2,
  },
  {
    postId: 9,
    groupId: 10,
  },
];

export const mockUserSharedDto = {
  id: 33,
  username: 'username33',
  fullname: 'fullname33',
  avatar: 'http://abc.com',
  groups: [1, 2],
};

export const mockUserSharedDtoNotInTheGroup = {
  id: 33,
  username: 'username33',
  fullname: 'fullname33',
  avatar: 'http://abc.com',
  groups: [],
};
