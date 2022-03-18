import { UserDto } from 'src/modules/auth';
import { GetTimelineDto } from '../../dto/request';
import { FeedRanking } from '../../feed.enum';

export const mockGetTimeLineDto: GetTimelineDto = {
  groupId: 9,
  offset: 0,
  limit: 25,
  ranking: FeedRanking.IMPORTANT,
};

export const mockUserDto: UserDto = {
  userId: 33,
};
