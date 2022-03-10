import { UserDto } from 'src/modules/auth';
import { ReactionEnum } from '../../reaction.enum';

export const mockCreateReactionDto = [
  {
    reactionName: 'smile',
    target: ReactionEnum.POST,
    targetId: 12,
    createdBy: 33,
  },
  {
    reactionName: 'sad',
    target: ReactionEnum.COMMENT,
    targetId: 89,
    createdBy: 22,
  },
];

export const mockUserInfoDto: UserDto = {
  userId: 33,
};
