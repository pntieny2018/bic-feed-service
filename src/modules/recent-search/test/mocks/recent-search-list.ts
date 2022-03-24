import { RecentSearchType } from '../..';
import { CreateRecentSearchDto, GetRecentSearchPostDto } from '../../dto/requests';

export const getRecentSearchesDto: GetRecentSearchPostDto = {
  sort: 'asc',
  limit: 10,
  target: 'post' as RecentSearchType,
};

export const createRecentSearchDto: CreateRecentSearchDto = {
  target: 'post',
  keyword: 'aaaaa',
};

export const mockedRecentSearchList = [
  {
    id: 1,
    createdBy: 1,
    updatedBy: 1,
    totalSearched: 1,
    target: 'post',
    keyword: 'aaaaa',
  },
  {
    id: 2,
    createdBy: 1,
    updatedBy: 1,
    totalSearched: 1,
    target: 'post',
    keyword: 'bbbb',
  },
];
