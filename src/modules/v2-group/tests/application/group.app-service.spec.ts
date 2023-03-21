import { Test, TestingModule } from '@nestjs/testing';
import { GroupApplicationService } from '../../application';
import { createMock } from '@golevelup/ts-jest';
import {
  GROUP_REPOSITORY_TOKEN,
  IGroupRepository,
} from '../../domain/repositoty-interface/group.repository.interface';
import { GroupRepository } from '../../driven-adapter/repository/group.repository';

describe('FindTagsPaginationHandler', () => {
  let groupAppService;
  let repo: IGroupRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupApplicationService,
        {
          provide: GROUP_REPOSITORY_TOKEN,
          useValue: createMock<GroupRepository>(),
        },
      ],
    }).compile();
    groupAppService = module.get<GroupApplicationService>(GroupApplicationService);
    repo = module.get(GROUP_REPOSITORY_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GroupService.getGroupIdAndChildIdsUserJoined', () => {
    const userMocked = {
      id: '7251dac7-5088-4a33-b900-d1b058edaf98',
      username: 'martine.baumbach',
      avatar: 'https://bein.group/baumbach.png',
      email: 'baumbach@tgm.vn',
      fullname: 'Martine Baumbach',
      groups: ['7251dac7-5088-4a33-b900-d1b058edaf99', '7251dac7-5088-4a33-b900-d1b058edaf90'],
    };
    it('Should', () => {
      expect(1).toBe(1);
    });
  });
});
