import { GroupDto } from '../../../v2-group/application';
import { CreateCommentProps } from '../../domain/factory/interface';
import { userMentions } from './user.dto.mock';

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
