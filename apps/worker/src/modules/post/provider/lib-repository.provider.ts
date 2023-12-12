import {
  LibPostGroupRepository,
  LibContentRepository,
  LibFollowRepository,
  LibUserNewsfeedRepository,
} from '@libs/database/postgres/repository';

export const libRepositoryProvider = [
  LibContentRepository,
  LibPostGroupRepository,
  LibFollowRepository,
  LibUserNewsfeedRepository,
];
