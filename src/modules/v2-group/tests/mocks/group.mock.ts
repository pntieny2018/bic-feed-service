import { GroupDto } from '../../application';
import { GROUP_PRIVACY } from '../../data-type';

export const groupMock: GroupDto[] = [
  {
    id: '22ccce09-0cea-4984-be0f-44e8839ac52b',
    name: 'Love TS',
    icon: 'ts',
    privacy: GROUP_PRIVACY.OPEN,
    rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
    communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
    isCommunity: false,
    child: {
      open: ['d3a2e019-1dba-485d-a8cf-ec037e9f25af', 'd3bc1d0d-0511-43e7-acfa-197a7aeab7eb'],
      closed: [],
      private: [],
      secret: [],
    },
  },
  {
    id: 'cc5df28b-885b-45a5-b44d-389b0f827c8a',
    name: 'Love Golang',
    icon: 'gl',
    privacy: GROUP_PRIVACY.CLOSED,
    rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
    communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
    isCommunity: false,
    child: {
      open: ['aac7a9ee-1432-4420-86d0-64a663e61123', '3e4822ee-063f-4029-86ca-2e98fae3c708'],
      closed: [],
      private: [],
      secret: [],
    },
  },
  {
    id: '94cc5afd-eaa9-4bb7-9150-5fde275e3cef',
    name: 'Love Golang',
    icon: 'gl',
    privacy: GROUP_PRIVACY.PRIVATE,
    rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
    communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
    isCommunity: false,
    child: {
      open: ['9d3468c0-4b35-49ad-b569-21f0f6e32a32', 'f8ff0be9-fd98-482e-a20c-0af26f37b4cf'],
      closed: [],
      private: [],
      secret: [],
    },
  },
  {
    id: '36d66fb6-5a24-4fb4-892e-1c38760da774',
    name: 'Love Golang',
    icon: 'gl',
    privacy: GROUP_PRIVACY.SECRET,
    rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
    communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
    isCommunity: false,
    child: {
      closed: [],
      open: [],
      private: [],
      secret: [],
    },
  },
];