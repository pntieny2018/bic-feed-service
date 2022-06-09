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
    privacy: GroupPrivacy.OPEN,
    child: {
      public: [2, 3],
      open: [],
      private: [],
      secret: [],
    },
  },
  {
    id: 3,
    name: 'Love Golang',
    icon: 'gl',
    privacy: GroupPrivacy.PRIVATE,
    child: {
      public: [4, 5],
      open: [],
      private: [],
      secret: [],
    },
  },
  {
    id: 8,
    name: 'Love Golang',
    icon: 'gl',
    privacy: GroupPrivacy.SECRET,
    child: {
      public: [],
      open: [],
      private: [],
      secret: [],
    },
  },
];
