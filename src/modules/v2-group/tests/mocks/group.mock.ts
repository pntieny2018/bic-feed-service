import { GroupDto } from '../../application';
import { GroupPrivacy } from '../../data-type';

export const groupMock: GroupDto[] = [
  {
    id: '22ccce09-0cea-4984-be0f-44e8839ac52b',
    name: 'Love TS',
    icon: 'ts',
    privacy: GroupPrivacy.OPEN,
    rootGroupId: '855bedeb-b708-4e13-8c68-131d92cd7911',
    communityId: '855bedeb-b708-4e13-8c68-131d92cd7912',
    isCommunity: false,
    child: {
      open: ['d3a2e019-1dba-485d-a8cf-ec037e9f25af', 'd3bc1d0d-0511-43e7-acfa-197a7aeab7eb'],
      closed: ['c4d5c2be-86f5-4db2-8959-af92ff5ae469', '4878cd75-16c0-40cc-84e4-ebc42bda2d99'],
      private: ['1d3251ef-f520-4703-b1e9-df29db4d6a9f', 'df98b0f0-c2b7-41dd-a4ee-28fea1e83231'],
      secret: ['d3a2e019-1dba-485d-a8cf-ec037e9f25a1', 'd3bc1d0d-0511-43e7-acfa-197a7aeab7e2'],
    },
  },
  {
    id: 'cc5df28b-885b-45a5-b44d-389b0f827c8a',
    name: 'Love Golang',
    icon: 'gl',
    privacy: GroupPrivacy.CLOSED,
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
    privacy: GroupPrivacy.PRIVATE,
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
    privacy: GroupPrivacy.SECRET,
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
