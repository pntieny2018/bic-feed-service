import { GroupSharedDto, GroupPrivacy } from '../../dto/group-shared.dto';

export const sharedGroupMock: GroupSharedDto[] = [
  {
    id: 1,
    name: 'Love TS',
    icon: 'ts',
    privacy: GroupPrivacy.PUBLIC,
    child: {
      public: [1, 2],
      open: [],
      private: [],
      secret: [],
    },
  },
  {
    id: 2,
    name: 'Love Golang',
    icon: 'gl',
    privacy: GroupPrivacy.PUBLIC,
    child: {
      public: [2, 3],
      open: [],
      private: [],
      secret: [],
    },
  },
];
