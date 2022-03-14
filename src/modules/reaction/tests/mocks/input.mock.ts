import { UserDto } from 'src/modules/auth';
import { ReactionEnum } from '../../reaction.enum';

export const mockCreateReactionDto = [
  {
    reactionName: 'smile',
    target: ReactionEnum.POST,
    targetId: 12,
  },
  {
    reactionName: 'sad',
    target: ReactionEnum.COMMENT,
    targetId: 89,
  },
];

export const mockUserDto: UserDto = {
  userId: 33,
};
