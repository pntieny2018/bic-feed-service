import { RecentSearchType } from '../..';
import { CreateRecentSearchDto, GetRecentSearchPostDto } from '../../dto/requests';

export const getRecentSearchesDto: GetRecentSearchPostDto = {
  target: 'post' as RecentSearchType,
};

export const createRecentSearchDto: CreateRecentSearchDto = {
  target: 'post',
  keyword: 'aaaaa',
};

export const mockedRecentSearchList = [
  {
    id: '1',
    createdBy: '85dfe22e-866d-49a5-bbef-3fbc72e4febf',
    updatedBy: '85dfe22e-866d-49a5-bbef-3fbc72e4febf',
    totalSearched: 1,
    target: 'post',
    keyword: 'aaaaa',
  },
  {
    id: '2',
    createdBy: '85dfe22e-866d-49a5-bbef-3fbc72e4febf',
    updatedBy: '85dfe22e-866d-49a5-bbef-3fbc72e4febf',
    totalSearched: 1,
    target: 'post',
    keyword: 'bbbb',
  },
];
