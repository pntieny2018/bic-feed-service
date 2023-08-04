import { GroupDto } from '../../../v2-group/application';
import { CreateCommentProps, UpdateCommentProps } from '../../domain/domain-service/interface';
import { CommentEntity } from '../../domain/model/comment';
import { userMentions, userMock } from './user.dto.mock';

export const createCommentProps: CreateCommentProps = {
  data: {
    userId: '6235bc91-2255-4f4b-bcfa-bebcd24e27ac',
    postId: '9bacb01c-deae-4d80-81d7-b619b26ef684',
    parentId: '00000000-0000-0000-0000-000000000000',
    content: 'This is a comment',
    giphyId: 'EZICHGrSD5QEFCxMiC',
    media: {
      files: [],
      images: ['95809c73-e73e-4c49-855a-67ff0ca58346'],
      videos: [],
    },
    mentions: ['0fa01fde-7c15-4d55-b60a-8e990123bc2e'],
  },
  groups: [{ id: '7251dac7-5088-4a33-b900-d1b058edaf99' }].map((item) => new GroupDto(item)),
  mentionUsers: userMentions,
};

export const updateCommentProps: UpdateCommentProps = {
  commentEntity: new CommentEntity({
    id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
    postId: '9bacb01c-deae-4d80-81d7-b619b26ef684',
    parentId: '00000000-0000-0000-0000-000000000000',
    content: 'This is a comment',
    giphyId: 'EZICHGrSD5QEFCxMiC',
    media: {
      files: [],
      images: [],
      videos: [],
    },
    mentions: ['0fa01fde-7c15-4d55-b60a-8e990123bc2e'],
    isHidden: false,
    edited: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userMock.id,
    updatedBy: userMock.id,
  }),
  newData: {
    id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
    content: 'This is a updated comment',
    media: {
      files: [],
      images: ['95809c73-e73e-4c49-855a-67ff0ca58346'],
      videos: [],
    },
    mentions: [],
    giphyId: 'ACICHGrSD5QEFC',
  },
  groups: [{ id: '7251dac7-5088-4a33-b900-d1b058edaf99' }].map((item) => new GroupDto(item)),
  mentionUsers: userMentions,
  actor: userMock,
};

export const notChangedCommentProps: UpdateCommentProps = {
  commentEntity: new CommentEntity({
    id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
    postId: '9bacb01c-deae-4d80-81d7-b619b26ef684',
    parentId: '00000000-0000-0000-0000-000000000000',
    content: 'This is a comment',
    giphyId: 'EZICHGrSD5QEFCxMiC',
    media: {
      files: [],
      images: [],
      videos: [],
    },
    mentions: ['0fa01fde-7c15-4d55-b60a-8e990123bc2e'],
    isHidden: false,
    edited: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: userMock.id,
    updatedBy: userMock.id,
  }),
  newData: {
    id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
    content: 'This is a comment',
    mentions: ['0fa01fde-7c15-4d55-b60a-8e990123bc2e'],
    giphyId: 'EZICHGrSD5QEFCxMiC',
  },
  groups: [{ id: '7251dac7-5088-4a33-b900-d1b058edaf99' }].map((item) => new GroupDto(item)),
  mentionUsers: userMentions,
  actor: userMock,
};
